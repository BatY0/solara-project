package com.solara.backend.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.locationtech.jts.geom.Point;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.solara.backend.dto.response.OpenMeteoResponse;
import com.solara.backend.entity.Field;
import com.solara.backend.entity.WeatherLog;
import com.solara.backend.exception.AppException;
import com.solara.backend.repository.FieldRepository;
import com.solara.backend.repository.WeatherLogRepository;

@Service
public class WeatherSyncService {

    private static final Logger log = LoggerFactory.getLogger(WeatherSyncService.class);

    private final FieldRepository fieldRepository;
    private final WeatherLogRepository weatherLogRepository;
    private final RestTemplate weatherRestTemplate; // from your WeatherAPIConfig

    public WeatherSyncService(FieldRepository fieldRepository,
                              WeatherLogRepository weatherLogRepository,
                              RestTemplate weatherRestTemplate) {
        this.fieldRepository = fieldRepository;
        this.weatherLogRepository = weatherLogRepository;
        this.weatherRestTemplate = weatherRestTemplate;
    }

    // Runs every day at 2:00 AM server time
    @Scheduled(cron = "0 0 2 * * ?")
    public void syncDailyWeatherData() {
        log.info("Starting daily weather sync...");
        
        LocalDate yesterday = LocalDate.now().minusDays(1);
        List<Field> fields = fieldRepository.findAll();

        for (Field field : fields) {
            try {
                // 1. Calculate the spatial centroid of the field polygon
                Point centroid = field.getLocation().getCentroid();
                double latitude = centroid.getY();
                double longitude = centroid.getX();

                // 2. Fetch yesterday's total rainfall and average temperature
                // Using api.open-meteo.com with past_days=1 for reliable "yesterday" data
                String url = String.format(
                    "https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&past_days=1&forecast_days=0&daily=temperature_2m_mean,precipitation_sum", 
                    latitude, longitude
                );

                OpenMeteoResponse apiResponse = weatherRestTemplate.getForObject(url, OpenMeteoResponse.class);

                // Since we only requested one day, the lists will have exactly 1 element at index 0
                double fetchedAvgTemp = apiResponse.daily().temperature2mMean().get(0);
                double fetchedRainfall = apiResponse.daily().precipitationSum().get(0);

                // 3. Save this to your local weather_logs PostgreSQL table
                WeatherLog weatherLog = WeatherLog.builder()
                        .fieldId(field.getId()) // Ensure field.getId() matches WeatherLog constructor/builder params
                        .logDate(yesterday)
                        .totalRainfall(fetchedRainfall)
                        .averageTemperature(fetchedAvgTemp)
                        .build();

                weatherLogRepository.save(weatherLog);
                log.info("Saved weather log for field {}", field.getId());

            } catch (Exception e) {
                log.error("Failed to sync weather data for field {}", field.getId(), e);
                throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
            }
        }
        
        log.info("Daily weather sync completed.");
    }

    @Async
    public void initializeFieldWeatherData(Field field) {
        log.info("Initializing 1 year of historical weather data for field {}", field.getId());
        
        LocalDate endDate = LocalDate.now().minusDays(1);
        LocalDate startDate = endDate.minusYears(1);

        Point centroid = field.getLocation().getCentroid();
        double latitude = centroid.getY();
        double longitude = centroid.getX();

        // Use the Archive API for long-term data as recommended by Open-Meteo docs
        String url = String.format(
            "https://archive-api.open-meteo.com/v1/archive?latitude=%s&longitude=%s&start_date=%s&end_date=%s&daily=temperature_2m_mean,precipitation_sum", 
            latitude, longitude, startDate, endDate
        );

        try {
            OpenMeteoResponse apiResponse = weatherRestTemplate.getForObject(url, OpenMeteoResponse.class);
            
            if (apiResponse != null && apiResponse.daily() != null) {
                List<WeatherLog> logsToSave = new ArrayList<>();
                int dataSize = apiResponse.daily().time().size();
                
                // Loop through the arrays returned by Open-Meteo
                for (int i = 0; i < dataSize; i++) {
                    LocalDate logDate = LocalDate.parse(apiResponse.daily().time().get(i));
                    Double avgTemp = apiResponse.daily().temperature2mMean().get(i);
                    Double rainfall = apiResponse.daily().precipitationSum().get(i);
                    
                    WeatherLog logItem = WeatherLog.builder()
                        .fieldId(field.getId())
                        .logDate(logDate)
                        .averageTemperature(avgTemp) // might be null if OpenMeteo lacks data for a specific day
                        .totalRainfall(rainfall)
                        .build();
                        
                    logsToSave.add(logItem);
                }
                
                // Batch save the full year
                weatherLogRepository.saveAll(logsToSave);
                log.info("Successfully saved {} historical weather records.", logsToSave.size());
            }
        } catch (Exception e) {
            log.error("Failed to initialize historical data for field {}: {}", field.getId(), e.getMessage());
        }
    }

    public void deleteWeatherLogsForField(UUID fieldId) {
        try {
            weatherLogRepository.deleteByFieldId(fieldId);
            log.info("Deleted weather logs for field {}", fieldId);
        } catch (Exception e) {
            log.error("Failed to delete weather logs for field {}: {}", fieldId, e.getMessage());
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public List<WeatherLog> getWeatherLogsForField(UUID fieldId) {
        try {
            return weatherLogRepository.findAllByFieldId(fieldId);
        } catch (Exception e) {
            log.error("Failed to fetch weather logs for field {}: {}", fieldId, e.getMessage());
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public void deleteWeatherLog(UUID fieldId, UUID logId) {
        try {
            weatherLogRepository.deleteByIdAndFieldId(logId, fieldId);
            log.info("Deleted weather log {} for field {}", logId, fieldId);
        } catch (Exception e) {
            log.error("Failed to delete weather log {} for field {}: {}", logId, fieldId, e.getMessage());
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }
}