package com.solara.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.solara.backend.entity.Field;
import com.solara.backend.entity.SensorLogs;
import com.solara.backend.exception.AppException;
import com.solara.backend.repository.SensorLogsRepository;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Service
public class SensorLogsService {
    private final SensorLogsRepository sensorRepo;
    private final FieldService fieldService;

    public SensorLogsService(SensorLogsRepository sensorRepo, FieldService fieldService) {
        this.sensorRepo = sensorRepo;
        this.fieldService = fieldService;
    }

    public enum Intervals {
        RAW, HOURLY, DAILY
    }

    @Data
    @Builder
    @NoArgsConstructor
    public static class AggregateLog {
        @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
        private java.time.OffsetDateTime period;
        private Double avgAmbientTemp;
        private Double avgSoilTemp;
        private Double avgAmbientHumidity;
        private Double avgSoilHumidity;

        public AggregateLog(OffsetDateTime period, Double avgAmbientTemp, Double avgSoilTemp, Double avgAmbientHumidity, Double avgSoilHumidity) {
            this.period = period;
            this.avgAmbientTemp = avgAmbientTemp;
            this.avgSoilTemp = avgSoilTemp;
            this.avgAmbientHumidity = avgAmbientHumidity;
            this.avgSoilHumidity = avgSoilHumidity;
        }

        public OffsetDateTime getPeriod() { return period; }
        public Double getAvgAmbientTemp() { return avgAmbientTemp; }
        public Double getAvgSoilTemp() { return avgSoilTemp; }
        public Double getAvgAmbientHumidity() { return avgAmbientHumidity; }
        public Double getAvgSoilHumidity() { return avgSoilHumidity; }
    }

    public Optional<SensorLogs> getMostRecent(UUID fieldId) {
        return sensorRepo.findByFieldId(fieldId).stream()
                .max(Comparator.comparing(SensorLogs::getTimestamp));
    }

    public List<AggregateLog> getLogsByInterval(Intervals interval, LocalDateTime start, LocalDateTime end, UUID fieldId) {
        if (start == null || end == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Start and end timestamps must be provided");
        }

        if (start.isAfter(end)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Start timestamp must be before end timestamp");
        }

        List<SensorLogs> logs = sensorRepo.findByFieldIdAndTimestampBetween(fieldId, start, end);

        if (interval == Intervals.RAW) {
            return logs.stream().map(log -> 
                new AggregateLog(
                    toUtcOffset(log.getTimestamp()), 
                    log.getAmbientTemp(), 
                    log.getSoilTemp(), 
                    log.getAmbientHumidity(), 
                    log.getSoilHumidity()
                )
            ).sorted(Comparator.comparing(AggregateLog::getPeriod))
            .collect(Collectors.toList());
        }

        // Determine the truncation unit based on interval
        ChronoUnit unit = (interval == Intervals.HOURLY) ? ChronoUnit.HOURS : ChronoUnit.DAYS;

        return logs.stream()
            // Group logs by time period
            .collect(Collectors.groupingBy(log -> log.getTimestamp().truncatedTo(unit)))
            .entrySet().stream()
            .map(entry -> {
                LocalDateTime period = entry.getKey();
                List<SensorLogs> periodLogs = entry.getValue();

                // Calculate averages, filtering nulls to avoid NullPointerException
                // (sensor may omit individual fields in some readings)
                Double avgAmbTemp = periodLogs.stream()
                        .filter(l -> l.getAmbientTemp() != null)
                        .mapToDouble(SensorLogs::getAmbientTemp)
                        .average().stream().boxed().findFirst().orElse(null);
                Double avgSoilTemp = periodLogs.stream()
                        .filter(l -> l.getSoilTemp() != null)
                        .mapToDouble(SensorLogs::getSoilTemp)
                        .average().stream().boxed().findFirst().orElse(null);
                Double avgAmbHum = periodLogs.stream()
                        .filter(l -> l.getAmbientHumidity() != null)
                        .mapToDouble(SensorLogs::getAmbientHumidity)
                        .average().stream().boxed().findFirst().orElse(null);
                Double avgSoilHum = periodLogs.stream()
                        .filter(l -> l.getSoilHumidity() != null)
                        .mapToDouble(SensorLogs::getSoilHumidity)
                        .average().stream().boxed().findFirst().orElse(null);

                return new AggregateLog(toUtcOffset(period), avgAmbTemp, avgSoilTemp, avgAmbHum, avgSoilHum);
            })
            // Sort by period
            .sorted(Comparator.comparing(AggregateLog::getPeriod))
            .collect(Collectors.toList());
    }

    public boolean hasLogsForField(UUID fieldId) {
        return sensorRepo.existsByFieldId(fieldId);
    }

    public byte[] exportToCSV(UUID fieldId){
        List<SensorLogs> logs = sensorRepo.findByFieldId(fieldId);

        ByteArrayOutputStream outstream = new ByteArrayOutputStream();
        try(PrintWriter printWriter = new PrintWriter(outstream, true, StandardCharsets.UTF_8)) {

            printWriter.println("Timestamp,Soil Temperature,Soil Humidity,Ambient Temperature,Ambient Humidity");

            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

            for (SensorLogs log: logs) {
                String timestamp = log.getTimestamp() != null ? log.getTimestamp().format(formatter) : "";

                printWriter.printf("%s,%s,%s,%s,%s%n",
                        timestamp,
                        safeString(log.getSoilTemp()),
                        safeString(log.getSoilHumidity()),
                        safeString(log.getAmbientTemp()),
                        safeString(log.getAmbientHumidity())
                );
            }
        }

        return outstream.toByteArray();
    }

    public long countLogsForUser(UUID userId) {
        List<Field> userFields = fieldService.getFieldsByUserId(userId);

        long totalLogs = 0;

        for(Field field : userFields) {
            totalLogs += sensorRepo.countByFieldId(field.getId());
        }
        return totalLogs;
    }

    public long countLogs() {
        return sensorRepo.count();
    }

    private String safeString(Object obj) {
        return obj == null ? "" : obj.toString();
    }

    private static OffsetDateTime toUtcOffset(LocalDateTime value) {
        return value == null ? null : value.atOffset(ZoneOffset.UTC);
    }

}
