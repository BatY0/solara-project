package com.solara.backend.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.AnalysisRequestDTO;
import com.solara.backend.dto.response.AnalysisResultDTO;
import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.entity.Field;
import com.solara.backend.entity.User;
import com.solara.backend.exception.AppException;
import com.solara.backend.service.AnalysisService;
import com.solara.backend.service.FieldService;

@RestController
@RequestMapping("/api/v1/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;
    private final FieldService fieldService;

    public AnalysisController(AnalysisService analysisService, FieldService fieldService) {
        this.analysisService = analysisService;
        this.fieldService = fieldService;
    }

    /**
     * POST /api/v1/analysis/range
     *
     * Orchestrates all three ML analysis scenarios:
     *   - Scenario A: isFuturePrediction=false → range analysis using sensor_logs (with weather_logs fallback)
     *   - Scenario B: isFuturePrediction=true, no overrides → climatology from local weather_logs
     *   - Scenario C: isFuturePrediction=true, overrides present → what-if simulation
     */
    @PostMapping("/range")
    public ApiResponse<AnalysisResultDTO> analyze(
            @RequestBody AnalysisRequestDTO request,
            @AuthenticationPrincipal User currentUser) {

        UUID fieldId = request.getFieldId();
        if (fieldId == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "fieldId is required.");
        }

        Field field = fieldService.getFieldById(fieldId);
        if (!field.getUserId().equals(currentUser.getID())) {
            throw new AppException(HttpStatus.FORBIDDEN,
                    "You do not have permission to analyze this field.");
        }

        AnalysisResultDTO result = analysisService.analyze(fieldId, request);
        return ApiResponse.success(result, HttpStatus.OK.value(), "Analysis completed successfully.");
    }

    /**
     * GET /api/v1/analysis/field/{fieldId}/last
     * Returns the most recent saved analysis for a field.
     * Returns 200 with null data if no analysis exists yet.
     */
    @GetMapping("/field/{fieldId}/last")
    public ApiResponse<AnalysisResultDTO> getLastAnalysis(
            @PathVariable("fieldId") UUID fieldId,
            @AuthenticationPrincipal User currentUser) {

        Field field = fieldService.getFieldById(fieldId);
        if (!field.getUserId().equals(currentUser.getID())) {
            throw new AppException(HttpStatus.FORBIDDEN,
                    "You do not have permission to view analysis for this field.");
        }

        AnalysisResultDTO result = analysisService.getLastAnalysis(fieldId).orElse(null);
        String message = (result == null)
                ? "No analysis has been run yet for this field."
                : "Last analysis retrieved successfully.";
        return ApiResponse.success(result, HttpStatus.OK.value(), message);
    }
}
