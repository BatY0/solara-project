package com.solara.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.EspDeviceDTO;
import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.dto.response.EspDeviceResponseDTO;
import com.solara.backend.service.EspDeviceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/admin/devices")
public class EspDeviceAdminController {

    private final EspDeviceService espDeviceService;

    public EspDeviceAdminController(EspDeviceService espDeviceService) {
        this.espDeviceService = espDeviceService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ApiResponse<List<EspDeviceResponseDTO>> getAllDevices() {
        return ApiResponse.success(espDeviceService.getAllDevices(), HttpStatus.OK.value(), "IoT devices retrieved successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ApiResponse<EspDeviceResponseDTO> createDevice(@Valid @RequestBody EspDeviceDTO deviceDTO) {
        return ApiResponse.success(espDeviceService.createDevice(deviceDTO), HttpStatus.CREATED.value(), "IoT device registered successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ApiResponse<EspDeviceResponseDTO> updateDevice(@PathVariable("id") UUID id, @Valid @RequestBody EspDeviceDTO deviceDTO) {
        return ApiResponse.success(espDeviceService.updateDevice(id, deviceDTO), HttpStatus.OK.value(), "IoT device updated successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDevice(@PathVariable("id") UUID id) {
        espDeviceService.deleteDevice(id);
        return ApiResponse.success(null, HttpStatus.OK.value(), "IoT device deleted successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/assign/{fieldId}")
    public ApiResponse<EspDeviceResponseDTO> assignToField(@PathVariable("id") UUID deviceId, @PathVariable("fieldId") UUID fieldId) {
        return ApiResponse.success(espDeviceService.assignToField(deviceId, fieldId), HttpStatus.OK.value(), "IoT device assigned to field successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/disconnect")
    public ApiResponse<EspDeviceResponseDTO> disconnectFromField(@PathVariable("id") UUID deviceId) {
        return ApiResponse.success(espDeviceService.disconnectFromField(deviceId), HttpStatus.OK.value(), "IoT device disconnected from field successfully.");
    }
}
