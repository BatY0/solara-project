package com.solara.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.response.SensorResponse;
import com.solara.backend.service.SensorLogsService;



@RestController
@RequestMapping("/api/v1/sensor")
public class SensorController {
    private final SensorLogsService sensorService;

    public SensorController(SensorLogsService sensorService) {
        this.sensorService = sensorService;
    }

    @GetMapping("/most-recent/{id}")
    public ResponseEntity<SensorResponse> getMostRecentSensorData(@PathVariable("id") UUID id) {
        return sensorService.getMostRecent(id)
                .map(log -> ResponseEntity.ok(new SensorResponse(log)))
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/telemetry/{id}/history")
    public List<SensorLogsService.AggregateLog> getHistoricalTelemetry(@PathVariable("id") UUID fieldId, @RequestParam("interval") String interval,
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam("end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        // No logs yet — return empty list instead of 404
        if (!sensorService.hasLogsForField(fieldId)) {
            return List.of();
        }

        List<SensorLogsService.AggregateLog> logs = sensorService.getLogsByInterval(
                SensorLogsService.Intervals.valueOf(interval.toUpperCase()), 
                start, 
                end, 
                fieldId
        );

        return logs;
    }
}
