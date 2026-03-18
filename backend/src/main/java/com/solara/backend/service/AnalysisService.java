package com.solara.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.AnalysisRequestDTO;
import com.solara.backend.dto.request.MlPayloadDTO;
import com.solara.backend.dto.response.AnalysisResultDTO;
import com.solara.backend.dto.response.MlCropRecommendationDTO;
import com.solara.backend.entity.Field;
import com.solara.backend.entity.FieldProperties;
import com.solara.backend.entity.SensorLogs;
import com.solara.backend.entity.WeatherLog;
import com.solara.backend.exception.AppException;
import com.solara.backend.repository.SensorLogsRepository;
import com.solara.backend.repository.WeatherLogRepository;

@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);
    private static final double CONFIDENCE_THRESHOLD = 20.0;

    private final SensorLogsRepository sensorLogsRepository;
    private final WeatherLogRepository weatherLogRepository;
    private final FieldPropertyService fieldPropertyService;
    private final MlEngineClient mlEngineClient;
    private final WeatherSyncService weatherSyncService;
    private final FieldService fieldService;

    public AnalysisService(SensorLogsRepository sensorLogsRepository,
                           WeatherLogRepository weatherLogRepository,
                           FieldPropertyService fieldPropertyService,
                           MlEngineClient mlEngineClient,
                           WeatherSyncService weatherSyncService,
                           FieldService fieldService) {
        this.sensorLogsRepository = sensorLogsRepository;
        this.weatherLogRepository = weatherLogRepository;
        this.fieldPropertyService = fieldPropertyService;
        this.mlEngineClient = mlEngineClient;
        this.weatherSyncService = weatherSyncService;
        this.fieldService = fieldService;
    }

    public AnalysisResultDTO analyze(UUID fieldId, AnalysisRequestDTO request) {
        // Self-healing: if weather_logs is completely empty (Open-Meteo was down at field
        // creation time), fetch the historical year now before proceeding.
        if (weatherLogRepository.findAllByFieldId(fieldId).isEmpty()) {
            log.warn("No weather logs found for field {} — triggering on-demand initialization.", fieldId);
            Field field = fieldService.getFieldById(fieldId);
            weatherSyncService.initializeFieldWeatherDataSync(field);
        }

        FieldProperties props = fieldPropertyService.getFieldPropertiesByFieldId(fieldId);
        if (props == null) {
            throw new AppException(HttpStatus.NOT_FOUND,
                    "No soil properties found for field: " + fieldId);
        }

        if (request.isFuturePrediction()) {
            return handleFutureOrWhatIf(fieldId, request, props);
        } else {
            return handleRange(fieldId, request, props);
        }
    }

    // ── Scenario A ────────────────────────────────────────────────────────────

    private AnalysisResultDTO handleRange(UUID fieldId, AnalysisRequestDTO request, FieldProperties props) {
        LocalDate start = request.getStartDate();
        LocalDate end   = request.getEndDate();

        if (start == null || end == null) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "startDate and endDate are required for a range analysis.");
        }
        if (start.isAfter(end)) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "startDate must not be after endDate.");
        }

        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt   = end.atTime(23, 59, 59);

        List<SensorLogs> sensorData = sensorLogsRepository
                .findByFieldIdAndTimestampBetween(fieldId, startDt, endDt);

        double temperature;
        double humidity;
        String weatherSource;

        if (!sensorData.isEmpty()) {
            // IoT data available — use sensor averages for temperature and humidity
            temperature = sensorData.stream()
                    .filter(s -> s.getAmbientTemp() != null)
                    .mapToDouble(SensorLogs::getAmbientTemp)
                    .average()
                    .orElse(0.0);

            humidity = sensorData.stream()
                    .filter(s -> s.getAmbientHumidity() != null)
                    .mapToDouble(SensorLogs::getAmbientHumidity)
                    .average()
                    .orElse(0.0);

            weatherSource = "IOT";
            log.info("Scenario A — using IoT data ({} records) for field {}", sensorData.size(), fieldId);
        } else {
            // IoT data missing — fall back to weather_logs
            log.warn("Scenario A — no IoT data for field {} in range [{}, {}], falling back to weather_logs",
                    fieldId, start, end);

            List<WeatherLog> weatherFallback = weatherLogRepository
                    .findByFieldIdAndLogDateBetween(fieldId, start, end);

            if (weatherFallback.isEmpty()) {
                throw new AppException(HttpStatus.valueOf(422),
                        "No sensor or weather data available for the requested date range.");
            }

            temperature = weatherFallback.stream()
                    .filter(w -> w.getAverageTemperature() != null)
                    .mapToDouble(WeatherLog::getAverageTemperature)
                    .average()
                    .orElse(0.0);

            humidity = weatherFallback.stream()
                    .filter(w -> w.getAverageHumidity() != null)
                    .mapToDouble(WeatherLog::getAverageHumidity)
                    .average()
                    .orElse(0.0);

            weatherSource = "WEATHER_LOG";
        }

        // Rainfall always comes from weather_logs — sensors do not measure precipitation.
        // We sum daily values to get total precipitation for the period, matching the
        // scale expected by the ML model (trained on seasonal/period totals in mm).
        List<WeatherLog> weatherForRainfall = weatherLogRepository
                .findByFieldIdAndLogDateBetween(fieldId, start, end);

        double rainfall = weatherForRainfall.stream()
                .filter(w -> w.getTotalRainfall() != null)
                .mapToDouble(WeatherLog::getTotalRainfall)
                .sum();

        MlPayloadDTO payload = buildPayload(props, temperature, humidity, rainfall, request.getTopN());
        List<MlCropRecommendationDTO> recommendations = filterAndCall(payload);

        return AnalysisResultDTO.builder()
                .fieldId(fieldId)
                .scenario("RANGE")
                .weatherSource(weatherSource)
                .timestamp(LocalDateTime.now())
                .recommendations(recommendations)
                .build();
    }

    // ── Scenario B & C ────────────────────────────────────────────────────────

    private AnalysisResultDTO handleFutureOrWhatIf(UUID fieldId, AnalysisRequestDTO request, FieldProperties props) {
        int monthStart = request.getTargetMonthStart();
        int monthEnd   = request.getTargetMonthEnd();

        if (monthStart < 1 || monthStart > 12 || monthEnd < 1 || monthEnd > 12) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "targetMonthStart and targetMonthEnd must be between 1 and 12.");
        }

        // Fetch all stored weather logs for the field and filter to target months
        List<WeatherLog> allLogs = weatherLogRepository.findAllByFieldId(fieldId);

        List<WeatherLog> seasonLogs = allLogs.stream()
                .filter(w -> {
                    int m = w.getLogDate().getMonthValue();
                    if (monthStart <= monthEnd) {
                        return m >= monthStart && m <= monthEnd;
                    } else {
                        // Wrap-around (e.g., Nov–Feb: 11,12,1,2)
                        return m >= monthStart || m <= monthEnd;
                    }
                })
                .toList();

        if (seasonLogs.isEmpty()) {
            throw new AppException(HttpStatus.valueOf(422),
                    "No historical weather data found for months " + monthStart + "–" + monthEnd
                    + " for field " + fieldId + ". Ensure the field has at least one year of weather data.");
        }

        double temperature = seasonLogs.stream()
                .filter(w -> w.getAverageTemperature() != null)
                .mapToDouble(WeatherLog::getAverageTemperature)
                .average()
                .orElse(0.0);

        double humidity = seasonLogs.stream()
                .filter(w -> w.getAverageHumidity() != null)
                .mapToDouble(WeatherLog::getAverageHumidity)
                .average()
                .orElse(0.0);

        double rainfall = seasonLogs.stream()
                .filter(w -> w.getTotalRainfall() != null)
                .mapToDouble(WeatherLog::getTotalRainfall)
                .sum();

        // Scenario C: apply user overrides on top of the climatology baseline
        Map<String, Double> overrides = request.getOverrides();
        boolean isWhatIf = overrides != null && !overrides.isEmpty();

        if (isWhatIf) {
            if (overrides.containsKey("temperature")) temperature = overrides.get("temperature");
            if (overrides.containsKey("humidity"))    humidity    = overrides.get("humidity");
            if (overrides.containsKey("rainfall"))    rainfall    = overrides.get("rainfall");
            log.info("Scenario C — what-if overrides applied for field {}: {}", fieldId, overrides);
        } else {
            log.info("Scenario B — climatology for field {} months {}-{}: temp={}, hum={}, rain={}",
                    fieldId, monthStart, monthEnd, temperature, humidity, rainfall);
        }

        MlPayloadDTO payload = buildPayload(props, temperature, humidity, rainfall, request.getTopN());
        List<MlCropRecommendationDTO> recommendations = filterAndCall(payload);

        return AnalysisResultDTO.builder()
                .fieldId(fieldId)
                .scenario(isWhatIf ? "WHAT_IF" : "FUTURE")
                .weatherSource("CLIMATOLOGY")
                .timestamp(LocalDateTime.now())
                .recommendations(recommendations)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private MlPayloadDTO buildPayload(FieldProperties props, double temperature,
                                      double humidity, double rainfall, int topN) {
        return MlPayloadDTO.builder()
                .n(props.getNitrogen()    != null ? props.getNitrogen()    : 52.6)
                .p(props.getPhosphorus()  != null ? props.getPhosphorus()  : 58.1)
                .k(props.getPotassium()   != null ? props.getPotassium()   : 52.0)
                .ph(props.getPh()         != null ? props.getPh()          : 6.44)
                .temperature(temperature)
                .humidity(humidity)
                .rainfall(rainfall)
                .topN(topN > 0 ? topN : 5)
                .build();
    }

    private List<MlCropRecommendationDTO> filterAndCall(MlPayloadDTO payload) {
        List<MlCropRecommendationDTO> raw = mlEngineClient.recommend(payload);
        return raw.stream()
                .filter(r -> r.getProbability() != null && r.getProbability() >= CONFIDENCE_THRESHOLD)
                .toList();
    }
}
