package com.solara.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.response.ErrorResponse;
import com.solara.backend.dto.response.SensorResponse;
import com.solara.backend.entity.SensorLogs;
import com.solara.backend.service.SensorLogsService;



@RestController
@RequestMapping("/api/v1/sensor")
public class SensorController {
    private final SensorLogsService sensorService;

    public SensorController(SensorLogsService sensorService) {
        this.sensorService = sensorService;
    }

    @GetMapping("/most-recent")
    public ResponseEntity<SensorResponse> getMethodName() {
        SensorLogs mostRecent = sensorService.getMostRecent();
        return new ResponseEntity<>(new SensorResponse(mostRecent), HttpStatus.OK);
    }

    @GetMapping("/telemetry/{id}/history")
    public ResponseEntity<?> getHistoricalTelemetry(@PathVariable UUID fieldId, @RequestParam String interval,
         @RequestParam(required = false) LocalDateTime start, @RequestParam(required = false) LocalDateTime end) {

        if (!sensorService.hasLogsForField(fieldId)) {
            ErrorResponse errorResponse = ErrorResponse.builder()
                    .status(HttpStatus.NOT_FOUND.value())
                    .error("Not Found")
                    .message("No sensor logs found for field with ID: " + fieldId)
                    .build();

            return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
        }

        List<SensorLogsService.AggregateLog> logs = sensorService.getLogsByInterval(
                SensorLogsService.Intervals.valueOf(interval.toUpperCase()), 
                start, 
                end, 
                fieldId
        );

        return new ResponseEntity<>(logs, HttpStatus.OK);
    }
}
