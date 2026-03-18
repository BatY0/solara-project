package com.solara.backend.service;

import java.util.UUID;

import org.locationtech.jts.geom.Point;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.solara.backend.dto.response.OpenMeteoCurrentResponse;
import com.solara.backend.entity.Field;

@Service
public class LiveWeatherService {

    private final RestTemplate weatherRestTemplate;
    private final FieldService fieldService;

    public LiveWeatherService(RestTemplate weatherRestTemplate, FieldService fieldService) {
        this.weatherRestTemplate = weatherRestTemplate;
        this.fieldService = fieldService;
    }

    // The result is cached based on the lat/lng parameters. 
    @Cacheable(value = "currentWeather", key = "#fieldId")
    public OpenMeteoCurrentResponse getCurrentWeather(UUID fieldId) {
        Field field = fieldService.getFieldById(fieldId);
        Point centroid = field.getLocation().getCentroid();
        double latitude = centroid.getY();
        double longitude = centroid.getX();

        // Note: For live current weather, Open-Meteo uses api.open-meteo.com for current= variables.
        // We avoid historical-forecast-api.open-meteo.com as it can be unreliable for specific timeframes.
        String url = String.format(
            "https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto",
            latitude, longitude
        );

        return weatherRestTemplate.getForObject(url, OpenMeteoCurrentResponse.class);
    }
}