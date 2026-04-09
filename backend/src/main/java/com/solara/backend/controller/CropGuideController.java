package com.solara.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.service.CropGuideService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.solara.backend.dto.request.CropGuideAdminUpsertDTO;
import com.solara.backend.dto.response.CropGuideResponseDTO;
import com.solara.backend.dto.response.CropGuideAdminResponseDTO;
import com.solara.backend.dto.response.CropNameIdDTO;
import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.entity.User;

import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;




@RestController
@RequestMapping("/api/v1/crop-guides")
public class CropGuideController {
    private final CropGuideService cropGuideService;

    public CropGuideController(CropGuideService cropGuideService) {
        this.cropGuideService = cropGuideService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/crop-guides")
    public ApiResponse<List<CropGuideAdminResponseDTO>> getCropGuideAdminList() {
        return ApiResponse.success(
                cropGuideService.getAdminList(),
                HttpStatus.OK.value(),
                "Admin crop guide list retrieved successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/crop-guides/{id}")
    public ApiResponse<CropGuideAdminResponseDTO> getCropGuideAdminDetail(@PathVariable("id") UUID id) {
        return ApiResponse.success(
                cropGuideService.getAdminById(id),
                HttpStatus.OK.value(),
                "Admin crop guide retrieved successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/crop-guides")
    public ApiResponse<CropGuideAdminResponseDTO> createCropGuideAdmin(@Valid @RequestBody CropGuideAdminUpsertDTO request) {
        return ApiResponse.success(
                cropGuideService.createAdminGuide(request),
                HttpStatus.CREATED.value(),
                "Admin crop guide created successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/crop-guides/{id}")
    public ApiResponse<CropGuideAdminResponseDTO> updateCropGuideAdmin(
            @PathVariable("id") UUID id,
            @Valid @RequestBody CropGuideAdminUpsertDTO request) {
        return ApiResponse.success(
                cropGuideService.updateAdminGuide(id, request),
                HttpStatus.OK.value(),
                "Admin crop guide updated successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/crop-guides/{id}")
    public ApiResponse<Void> deleteCropGuideAdmin(@PathVariable("id") UUID id) {
        cropGuideService.deleteGuide(id);
        return ApiResponse.success(null, HttpStatus.OK.value(), "Admin crop guide deleted successfully.");
    }

    @GetMapping("/get-guides-paginated")
    public ApiResponse<Page<CropGuideResponseDTO>> getAllGuidesPaginated(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "lang", required = false) String lang,
            @AuthenticationPrincipal User currentUser) {
        String preferredLanguage = resolveLanguage(lang, currentUser);
        Page<CropGuideResponseDTO> cropDTOsPage = cropGuideService.getAllPaginatedLocalized(page, size, preferredLanguage);

        return ApiResponse.success(
            cropDTOsPage, HttpStatus.OK.value(), "Crop guides retrieved successfully with pagination."
        );
    }

    @GetMapping("/get-all-guides")
    public ApiResponse<List<CropGuideResponseDTO>> getAllGuides(
            @RequestParam(value = "lang", required = false) String lang,
            @AuthenticationPrincipal User currentUser) {
        String preferredLanguage = resolveLanguage(lang, currentUser);
        List<CropGuideResponseDTO> cropDTOs = cropGuideService.getAllLocalized(preferredLanguage);

        return ApiResponse.success(
            cropDTOs, HttpStatus.OK.value(), "All crop guides retrieved successfully."
        );
    }
    
    @GetMapping("/names-and-ids")
    public ApiResponse<List<CropNameIdDTO>> getAllCropNamesAndIds() {
        List<CropNameIdDTO> result = cropGuideService.getAllCropNamesAndIds();
        return ApiResponse.success(result, HttpStatus.OK.value(), "Crop names and IDs retrieved successfully.");
    }
    
    @GetMapping("/get-guide/{id}")
    public ApiResponse<CropGuideResponseDTO> getGuide(
            @PathVariable("id") UUID id,
            @RequestParam(value = "lang", required = false) String lang,
            @AuthenticationPrincipal User currentUser) {
        String preferredLanguage = resolveLanguage(lang, currentUser);
        CropGuideResponseDTO cropGuide = cropGuideService.getByIdLocalized(id, preferredLanguage);
        return ApiResponse.success(cropGuide, HttpStatus.OK.value(), "Crop guide retrieved successfully.");
    }

    private String resolveLanguage(String lang, User currentUser) {
        if (lang != null && !lang.isBlank()) {
            String normalized = lang.toLowerCase();
            if ("tr".equals(normalized) || "en".equals(normalized)) {
                return normalized;
            }
        }
        return currentUser != null ? currentUser.getPreferredLanguage() : "en";
    }
    
}
