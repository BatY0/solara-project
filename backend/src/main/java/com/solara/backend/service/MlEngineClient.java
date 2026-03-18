package com.solara.backend.service;

import java.util.Collections;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.solara.backend.dto.request.MlPayloadDTO;
import com.solara.backend.dto.response.MlCropRecommendationDTO;
import com.solara.backend.dto.response.MlEngineResponseDTO;
import com.solara.backend.exception.AppException;

@Service
public class MlEngineClient {

    private static final Logger log = LoggerFactory.getLogger(MlEngineClient.class);

    private final RestTemplate weatherRestTemplate;
    private final String mlEngineUrl;

    public MlEngineClient(RestTemplate weatherRestTemplate,
                          @Value("${ml.engine.url}") String mlEngineUrl) {
        this.weatherRestTemplate = weatherRestTemplate;
        this.mlEngineUrl = mlEngineUrl;
    }

    public List<MlCropRecommendationDTO> recommend(MlPayloadDTO payload) {
        String endpoint = mlEngineUrl + "/api/v1/recommend";
        log.info("Calling ML engine at {} with payload: {}", endpoint, payload);

        try {
            MlEngineResponseDTO response = weatherRestTemplate.postForObject(
                    endpoint, payload, MlEngineResponseDTO.class);

            if (response == null || response.getRecommendations() == null) {
                log.warn("ML engine returned null response");
                return Collections.emptyList();
            }

            return response.getRecommendations();
        } catch (RestClientException e) {
            log.error("ML engine call failed: {}", e.getMessage());
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "ML engine is unavailable. Please try again later.");
        }
    }
}
