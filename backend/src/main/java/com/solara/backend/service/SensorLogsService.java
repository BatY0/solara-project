package com.solara.backend.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.solara.backend.entity.SensorLogs;
import com.solara.backend.repository.SensorLogsRepository;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Service
public class SensorLogsService {
    private final SensorLogsRepository sensorRepo;

    public SensorLogsService(SensorLogsRepository sensorRepo) {
        this.sensorRepo = sensorRepo;
    }

    public enum Intervals {
        HOURLY, DAILY
    }

    @Data
    @Builder
    @NoArgsConstructor
    public static class AggregateLog {
        private LocalDateTime period;
        private Double avgAmbientTemp;
        private Double avgSoilTemp;
        private Double avgAmbientHumidity;

        public AggregateLog(LocalDateTime period, Double avgAmbientTemp, Double avgSoilTemp, Double avgAmbientHumidity) {
            this.period = period;
            this.avgAmbientTemp = avgAmbientTemp;
            this.avgSoilTemp = avgSoilTemp;
            this.avgAmbientHumidity = avgAmbientHumidity;
        }

        public LocalDateTime getPeriod() { return period; }
        public Double getAvgAmbientTemp() { return avgAmbientTemp; }
        public Double getAvgSoilTemp() { return avgSoilTemp; }
        public Double getAvgAmbientHumidity() { return avgAmbientHumidity; }
    }

    public SensorLogs getMostRecent(UUID fieldId) {
        if (!sensorRepo.existsByFieldId(fieldId)) {
            throw new IllegalArgumentException("No sensor logs found for field with ID: " + fieldId);
        }

        SensorLogs mostRecent = sensorRepo.findByFieldId(fieldId).stream()
                .max((s1, s2) -> s1.getTimestamp().compareTo(s2.getTimestamp()))
                .orElse(null);
        return mostRecent;
    }

    public List<AggregateLog> getLogsByInterval(Intervals interval, LocalDateTime start, LocalDateTime end, UUID fieldId) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Start and end timestamps must be provided");
        }

        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Start timestamp must be before end timestamp");
        }

        List<SensorLogs> logs = sensorRepo.findByTimestampBetweenWithFieldId(start, end, fieldId);

        // Determine the truncation unit based on interval
        ChronoUnit unit = (interval == Intervals.HOURLY) ? ChronoUnit.HOURS : ChronoUnit.DAYS;

        return logs.stream()
            // Group logs by time period
            .collect(Collectors.groupingBy(log -> log.getTimestamp().truncatedTo(unit)))
            .entrySet().stream()
            .map(entry -> {
                LocalDateTime period = entry.getKey();
                List<SensorLogs> periodLogs = entry.getValue();

                // Calculate averages
                // Ensure SensorLogs entity has getAmbientTemp(), getSoilTemp(), getAmbientHumidity()
                double avgAmbTemp = periodLogs.stream().mapToDouble(SensorLogs::getAmbientTemp).average().orElse(0.0);
                double avgSoilTemp = periodLogs.stream().mapToDouble(SensorLogs::getSoilTemp).average().orElse(0.0);
                double avgAmbHum = periodLogs.stream().mapToDouble(SensorLogs::getAmbientHumidity).average().orElse(0.0);

                return new AggregateLog(period, avgAmbTemp, avgSoilTemp, avgAmbHum);
            })
            // Sort by period
            .sorted(Comparator.comparing(AggregateLog::getPeriod))
            .collect(Collectors.toList());
    }

    public boolean hasLogsForField(UUID fieldId) {
        return sensorRepo.existsByFieldId(fieldId);
    }

}
