package com.solara.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solara.backend.dto.request.AnalysisRequestDTO;
import com.solara.backend.dto.request.MlPayloadDTO;
import com.solara.backend.dto.response.AnalysisResultDTO;
import com.solara.backend.dto.response.MlCropRecommendationDTO;
import com.solara.backend.entity.AnalysisLog;
import com.solara.backend.entity.Field;
import com.solara.backend.entity.FieldProperties;
import com.solara.backend.entity.SensorLogs;
import com.solara.backend.entity.WeatherLog;
import com.solara.backend.exception.AppException;
import com.solara.backend.repository.AnalysisLogRepository;
import com.solara.backend.repository.SensorLogsRepository;
import com.solara.backend.repository.WeatherLogRepository;

@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);
    private static final double CONFIDENCE_THRESHOLD = 5.0;

    private final SensorLogsRepository sensorLogsRepository;
    private final WeatherLogRepository weatherLogRepository;
    private final FieldPropertyService fieldPropertyService;
    private final MlEngineClient mlEngineClient;
    private final WeatherSyncService weatherSyncService;
    private final FieldService fieldService;
    private final AnalysisLogRepository analysisLogRepository;
    private final ObjectMapper objectMapper;

    public AnalysisService(SensorLogsRepository sensorLogsRepository,
                           WeatherLogRepository weatherLogRepository,
                           FieldPropertyService fieldPropertyService,
                           MlEngineClient mlEngineClient,
                           WeatherSyncService weatherSyncService,
                           FieldService fieldService,
                           AnalysisLogRepository analysisLogRepository,
                           ObjectMapper objectMapper) {
        this.sensorLogsRepository = sensorLogsRepository;
        this.weatherLogRepository = weatherLogRepository;
        this.fieldPropertyService = fieldPropertyService;
        this.mlEngineClient = mlEngineClient;
        this.weatherSyncService = weatherSyncService;
        this.fieldService = fieldService;
        this.analysisLogRepository = analysisLogRepository;
        this.objectMapper = objectMapper;
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
        // IMPORTANT: The ML model was trained on ANNUAL rainfall values, so even in
        // Scenario A (range analysis) we derive rainfall from a 1‑year window rather
        // than just the requested dates. We use the last 12 months ending at 'end'.
        LocalDate annualEnd = end;
        LocalDate annualStart = annualEnd.minusYears(1).plusDays(1);

        List<WeatherLog> annualLogs = weatherLogRepository
                .findByFieldIdAndLogDateBetween(fieldId, annualStart, annualEnd);

        // If we somehow have no data for that rolling year (e.g., very new field),
        // fall back to summing over the user-provided range so we still return
        // something meaningful instead of failing.
        List<WeatherLog> rainfallLogs = annualLogs.isEmpty()
                ? weatherLogRepository.findByFieldIdAndLogDateBetween(fieldId, start, end)
                : annualLogs;

        double rainfall = rainfallLogs.stream()
                .filter(w -> w.getTotalRainfall() != null)
                .mapToDouble(WeatherLog::getTotalRainfall)
                .sum();

        MlPayloadDTO payload = buildPayload(props, temperature, humidity, rainfall, request.getTopN());
        List<MlCropRecommendationDTO> recommendations = filterAndCall(payload);

        AnalysisResultDTO result = AnalysisResultDTO.builder()
                .fieldId(fieldId)
                .scenario("RANGE")
                .weatherSource(weatherSource)
                .timestamp(LocalDateTime.now())
                .recommendations(recommendations)
                .build();

        saveAnalysisLog(result);
        return result;
    }

    // ── Scenario B & C ────────────────────────────────────────────────────────

    private AnalysisResultDTO handleFutureOrWhatIf(UUID fieldId, AnalysisRequestDTO request, FieldProperties props) {
        int monthStart = request.getTargetMonthStart();
        int monthEnd   = request.getTargetMonthEnd();

        if (monthStart < 1 || monthStart > 12 || monthEnd < 1 || monthEnd > 12) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "targetMonthStart and targetMonthEnd must be between 1 and 12.");
        }

        // Fetch all stored weather logs for the field
        List<WeatherLog> allLogs = weatherLogRepository.findAllByFieldId(fieldId);

        if (allLogs.isEmpty()) {
            throw new AppException(HttpStatus.valueOf(422),
                    "No historical weather data found for field " + fieldId
                    + ". Ensure the field has at least one year of weather data.");
        }

        // Determine the most recent log date so we can walk backwards in 1-year windows.
        LocalDate latestDate = allLogs.stream()
                .map(WeatherLog::getLogDate)
                .max(LocalDate::compareTo)
                .orElseThrow();

        int maxYears = 5; // cap how many past years to include in the climatology
        int yearsUsed = 0;

        double sumOfYearlyTemps = 0.0;
        double sumOfYearlyHumidity = 0.0;
        double sumOfYearlyRainfall = 0.0;

        for (int k = 0; k < maxYears; k++) {
            // Window: (end-1year, end] — i.e. one full year back from the current end
            LocalDate windowEnd = latestDate.minusYears(k);
            LocalDate windowStart = windowEnd.minusYears(1).plusDays(1);

            // All logs in this 1-year window (used for ANNUAL rainfall)
            List<WeatherLog> windowLogsYear = allLogs.stream()
                    .filter(w -> {
                        LocalDate d = w.getLogDate();
                        return !d.isBefore(windowStart) && !d.isAfter(windowEnd);
                    })
                    .toList();

            // Within that year, restrict to the target months (used for SEASONAL temp/humidity)
            List<WeatherLog> windowLogsSeason = windowLogsYear.stream()
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

            if (windowLogsSeason.isEmpty() || windowLogsYear.isEmpty()) {
                // No more complete years with data for the requested months
                break;
            }

            // Seasonal temperature/humidity: only logs in the requested months
            double yearTemp = windowLogsSeason.stream()
                    .filter(w -> w.getAverageTemperature() != null)
                    .mapToDouble(WeatherLog::getAverageTemperature)
                    .average()
                    .orElse(0.0);

            double yearHum = windowLogsSeason.stream()
                    .filter(w -> w.getAverageHumidity() != null)
                    .mapToDouble(WeatherLog::getAverageHumidity)
                    .average()
                    .orElse(0.0);

            // Annual rainfall: sum over the FULL year window, regardless of month,
            // to match the ML model which was trained on yearly rainfall.
            double yearRain = windowLogsYear.stream()
                    .filter(w -> w.getTotalRainfall() != null)
                    .mapToDouble(WeatherLog::getTotalRainfall)
                    .sum();

            sumOfYearlyTemps += yearTemp;
            sumOfYearlyHumidity += yearHum;
            sumOfYearlyRainfall += yearRain;
            yearsUsed++;
        }

        if (yearsUsed == 0) {
            throw new AppException(HttpStatus.valueOf(422),
                    "Not enough historical weather data for months " + monthStart + "–" + monthEnd
                    + " for field " + fieldId + ". Ensure the field has at least one year of weather data.");
        }

        // Final climatology: average of per-year seasonal statistics, so rainfall is effectively
        // \"average yearly\" rainfall for the requested months, matching the ML model training scale.
        double temperature = sumOfYearlyTemps / yearsUsed;
        double humidity = sumOfYearlyHumidity / yearsUsed;
        double rainfall = sumOfYearlyRainfall / yearsUsed;

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

        AnalysisResultDTO result = AnalysisResultDTO.builder()
                .fieldId(fieldId)
                .scenario(isWhatIf ? "WHAT_IF" : "FUTURE")
                .weatherSource("CLIMATOLOGY")
                .timestamp(LocalDateTime.now())
                .recommendations(recommendations)
                .build();

        saveAnalysisLog(result);
        return result;
    }

    public long countAnalysisLogsForUser(UUID userId) {
        long total = 0;

        List<Field> userFields = fieldService.getFieldsByUserId(userId);

        for (Field field : userFields) {
            long count = analysisLogRepository.countByFieldId(field.getId());
            total += count;
        }
        
        return total;
    }

    public long countAnalysisLogs() {
        return analysisLogRepository.count();
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

    private void saveAnalysisLog(AnalysisResultDTO result) {
        try {
            String recommendationsJson = objectMapper.writeValueAsString(result.getRecommendations());
            AnalysisLog logEntry = AnalysisLog.builder()
                    .fieldId(result.getFieldId())
                    .scenario(result.getScenario())
                    .weatherSource(result.getWeatherSource())
                    .recommendations(recommendationsJson)
                    .build();
            analysisLogRepository.save(logEntry);
            log.info("Saved analysis log for field {} scenario {}", result.getFieldId(), result.getScenario());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize recommendations for analysis log: {}", e.getMessage());
        }
    }

    public Optional<AnalysisResultDTO> getLastAnalysis(UUID fieldId) {
        return analysisLogRepository.findTopByFieldIdOrderByCreatedAtDesc(fieldId)
                .map(entry -> {
                    try {
                        List<MlCropRecommendationDTO> recommendations = objectMapper.readValue(
                                entry.getRecommendations(),
                                new TypeReference<List<MlCropRecommendationDTO>>() {});
                        return AnalysisResultDTO.builder()
                                .fieldId(entry.getFieldId())
                                .scenario(entry.getScenario())
                                .weatherSource(entry.getWeatherSource())
                                .timestamp(entry.getCreatedAt())
                                .recommendations(recommendations)
                                .build();
                    } catch (JsonProcessingException e) {
                        log.error("Failed to deserialize analysis log {}: {}", entry.getId(), e.getMessage());
                        return null;
                    }
                });
    }
}
