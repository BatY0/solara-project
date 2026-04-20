package com.solara.backend.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.solara.backend.dto.request.EspDeviceDTO;
import com.solara.backend.dto.response.EspDeviceResponseDTO;
import com.solara.backend.entity.EspDevice;
import com.solara.backend.exception.AppException;
import com.solara.backend.repository.EspDeviceRepository;


@Service
public class EspDeviceService {

    private final EspDeviceRepository espDeviceRepository;
    private final FieldService fieldService;

    public EspDeviceService(EspDeviceRepository espDeviceRepository, FieldService fieldService) {
        this.espDeviceRepository = espDeviceRepository;
        this.fieldService = fieldService;
    }

    public List<EspDeviceResponseDTO> getAllDevices() {
        return espDeviceRepository.findAll()
                .stream()
                .map(EspDeviceResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public EspDeviceResponseDTO createDevice(EspDeviceDTO dto) {
        if (espDeviceRepository.existsBySerialNumber(dto.getSerialNumber())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Device with this serial number already exists.");
        }

        EspDevice device = EspDevice.builder()
                .serialNumber(dto.getSerialNumber())
                .status(dto.getStatus())
                .build();

        device = espDeviceRepository.save(device);
        return new EspDeviceResponseDTO(device);
    }

    @Transactional
    public EspDeviceResponseDTO updateDevice(UUID id, EspDeviceDTO dto) {
        EspDevice device = espDeviceRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Device not found."));

        if (!device.getSerialNumber().equals(dto.getSerialNumber()) && espDeviceRepository.existsBySerialNumber(dto.getSerialNumber())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Another device with this serial number already exists.");
        }

        device.setSerialNumber(dto.getSerialNumber());
        device.setStatus(dto.getStatus());
        device = espDeviceRepository.save(device);
        return new EspDeviceResponseDTO(device);
    }

    @Transactional
    public void deleteDevice(UUID id) {
        EspDevice device = espDeviceRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Device not found."));

        if (device.getField() != null) {
            fieldService.unpairDevice(device.getField().getId());
        }

        espDeviceRepository.delete(device);
    }

    @Transactional
    public EspDeviceResponseDTO assignToField(UUID deviceId, UUID fieldId) {
        EspDevice device = espDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Device not found."));

        // Use FieldService logic
        fieldService.pairDevice(fieldId, device.getSerialNumber());
        
        device = espDeviceRepository.findById(deviceId).get(); // re-fetch to get mapped field
        return new EspDeviceResponseDTO(device);
    }

    @Transactional
    public EspDeviceResponseDTO disconnectFromField(UUID deviceId) {
        EspDevice device = espDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Device not found."));

        if (device.getField() != null) {
            fieldService.unpairDevice(device.getField().getId());
        }

        device = espDeviceRepository.findById(deviceId).get();
        return new EspDeviceResponseDTO(device);
    }
 }
