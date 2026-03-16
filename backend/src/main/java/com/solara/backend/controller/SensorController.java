package com.solara.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.response.SensorResponse;
import com.solara.backend.entity.SensorLogs;
import com.solara.backend.exception.AppException;
import com.solara.backend.service.SensorLogsService;



@RestController
@RequestMapping("/api/v1/sensor")
public class SensorController {
    private final SensorLogsService sensorService;

    public SensorController(SensorLogsService sensorService) {
        this.sensorService = sensorService;
    }

    @GetMapping("/most-recent/{id}")
    public SensorResponse getMostRecentSensorData(@PathVariable UUID id) {
        if (!sensorService.hasLogsForField(id)) {
            throw new AppException(HttpStatus.NOT_FOUND, "No sensor log has been  found for the provided id" + id);
        }

        SensorLogs mostRecent = sensorService.getMostRecent(id);
        return new SensorResponse(mostRecent);
    }

    @GetMapping("/telemetry/{id}/history")
    public List<SensorLogsService.AggregateLog> getHistoricalTelemetry(@PathVariable("id") UUID fieldId, @RequestParam String interval,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        if (!sensorService.hasLogsForField(fieldId)) {
            throw new AppException(HttpStatus.NOT_FOUND, "No sensor log has been  found for the provided id" + fieldId);
        }

        List<SensorLogsService.AggregateLog> logs = sensorService.getLogsByInterval(
                SensorLogsService.Intervals.valueOf(interval.toUpperCase()), 
                start, 
                end, 
                fieldId
        );

        return logs;
    }

    public class HistoryRequestDto {
        private String interval;
        private LocalDateTime start;
        private LocalDateTime end;

        // Getters and setters
        public String getInterval() {
            return interval;
        }

        public void setInterval(String interval) {
            this.interval = interval;
        }

        public LocalDateTime getStart() {
            return start;
        }

        public void setStart(LocalDateTime start) {
            this.start = start;
        }

        public LocalDateTime getEnd() {
            return end;
        }

        public void setEnd(LocalDateTime end) {
            this.end = end;
        }
    }
}
