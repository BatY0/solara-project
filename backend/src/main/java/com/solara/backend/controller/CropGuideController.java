package com.solara.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.service.CropGuideService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.solara.backend.dto.request.CropDTO;
import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.entity.CropGuide;

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
    @PostMapping("/admin/create-guide")
    public ApiResponse<CropDTO> createCropGuide(@Valid @RequestBody CropDTO cropDTO) {
        CropGuide cropGuide = cropDTO.toEntity();
        cropGuide = cropGuideService.createGuide(cropGuide);
        return ApiResponse.success(new CropDTO(cropGuide), HttpStatus.CREATED.value(), "Crop guide created successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/update-guide/{id}")
    public ApiResponse<CropDTO> updateCropGuide(@PathVariable("id") UUID id, @Valid @RequestBody CropDTO cropDTO) {
        CropGuide cropGuide = cropDTO.toEntity();
        cropGuide = cropGuideService.updateGuide(id, cropGuide);
        return ApiResponse.success(new CropDTO(cropGuide), HttpStatus.OK.value(), "Crop guide updated successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/delete-guide/{id}")
    public ApiResponse<Void> deleteCropGuide(@PathVariable("id") UUID id) {
        cropGuideService.deleteGuide(id);
        return ApiResponse.success(null, HttpStatus.OK.value(), "Crop guide with id " + id + " deleted successfully.");
    }

    @GetMapping("/get-guides-paginated")
    public ApiResponse<Page<CropDTO>> getAllGuidesPaginated(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        Page<CropGuide> cropGuidesPage = cropGuideService.getAllPaginated(page, size);
        Page<CropDTO> cropDTOsPage = cropGuidesPage.map(CropDTO::new);

        return ApiResponse.success(
            cropDTOsPage, HttpStatus.OK.value(), "Crop guides retrieved successfully with pagination."
        );
    }

    @GetMapping("/get-all-guides")
    public ApiResponse<List<CropDTO>> getAllGuides() {
        List<CropGuide> cropGuides = cropGuideService.getAll();
        List<CropDTO> cropDTOs = cropGuides.stream().map(CropDTO::new).toList();

        return ApiResponse.success(
            cropDTOs, HttpStatus.OK.value(), "All crop guides retrieved successfully."
        );
    }
    
    @GetMapping("/get-guide/{id}")
    public ApiResponse<CropDTO> getGuide(@PathVariable("id") UUID id) {
        CropGuide cropGuide = cropGuideService.getById(id);
        return ApiResponse.success(new CropDTO(cropGuide), HttpStatus.OK.value(), "Crop guide retrieved successfully.");
    }
    
}
