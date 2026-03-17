package com.solara.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.dto.response.OpenMeteoCurrentResponse;
import com.solara.backend.entity.WeatherLog;
import com.solara.backend.service.LiveWeatherService;
import com.solara.backend.service.WeatherSyncService;


@RestController
@RequestMapping("/api/v1/weather-api")
public class WeatherAPIController {

    private final WeatherSyncService weatherSyncService;
    private final LiveWeatherService liveWeatherService;

    public WeatherAPIController(WeatherSyncService weatherSyncService, LiveWeatherService liveWeatherService) {
        this.weatherSyncService = weatherSyncService;
        this.liveWeatherService = liveWeatherService;
    }

    // Manual trigger for testing or admin purposes
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/sync")
    public ResponseEntity<String> forceSyncWeatherData() {
        // Calls the same method the cron job uses
        weatherSyncService.syncDailyWeatherData();
        return ResponseEntity.ok("Weather sync triggered manually.");
    }

    @GetMapping("/live/{fieldId}")
    public ApiResponse<OpenMeteoCurrentResponse> getLiveWeather(@PathVariable("fieldId") UUID fieldId) {
        var liveWeather = liveWeatherService.getCurrentWeather(fieldId);
        return ApiResponse.success(liveWeather, HttpStatus.OK.value(), "Live weather data fetched successfully");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/get-all-for-field/{fieldID}")
    public ApiResponse<List<WeatherLog>> getWeatherLogsForField(@PathVariable("fieldID") UUID fieldID) {
        List<WeatherLog> logs = weatherSyncService.getWeatherLogsForField(fieldID);
        return ApiResponse.success(logs, HttpStatus.OK.value(), "Weather logs fetched successfully");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/delete-all-for-field/{fieldID}")
    public ApiResponse<String> deleteWeatherLogsForField(@PathVariable("fieldID") UUID fieldID) {
        weatherSyncService.deleteWeatherLogsForField(fieldID);
        return ApiResponse.success(null, HttpStatus.OK.value(), "Weather logs deleted successfully for field " + fieldID);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/delete-one-for-field/{fieldID}/{logID}")
    public ApiResponse<String> deleteWeatherLog(@PathVariable("fieldID") UUID fieldID, @PathVariable("logID") UUID logID) {
        weatherSyncService.deleteWeatherLog(logID, fieldID);
        return ApiResponse.success(null, HttpStatus.OK.value(), "Weather log deleted successfully for field " + fieldID);
    }

}
