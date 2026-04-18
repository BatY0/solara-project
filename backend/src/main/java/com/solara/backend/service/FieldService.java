 package com.solara.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.solara.backend.entity.Field;
import com.solara.backend.exception.AppException;
import com.solara.backend.repository.FieldRepository;

@Service
public class FieldService {

    private final FieldRepository fieldRepository;
    private final WeatherSyncService weatherSyncService;
    private final com.solara.backend.repository.EspDeviceRepository espDeviceRepository;

    public FieldService(FieldRepository fieldRepo, WeatherSyncService weatherSyncService, com.solara.backend.repository.EspDeviceRepository espDeviceRepository) {
        this.fieldRepository = fieldRepo;
        this.weatherSyncService = weatherSyncService;
        this.espDeviceRepository = espDeviceRepository;
    }

    @Transactional
    public Field createField(Field field) {
        Field savedField = fieldRepository.save(field);
        
        // Fetch past year's data for the new field
        weatherSyncService.initializeFieldWeatherData(savedField);
        
        return savedField;
    }

    public List<Field> getAllFields() {
        return fieldRepository.findAll();
    }

    public Page<Field> getAllFieldsPaginated(int page, int size) {
        Pageable pageable = Pageable.ofSize(size).withPage(page);
        return fieldRepository.findAll(pageable);
    }
 
    public Field getFieldById(UUID id) {
        return fieldRepository.findById(id).orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Field not found with id: " + id));
    }

    public List<Field> getFieldsByUserId(UUID userId) {
        return fieldRepository.findByUserId(userId);
    }

    public boolean userHasAccessToField(UUID userId, UUID fieldId) {
        return fieldRepository.existsByIdAndUserId(fieldId, userId);
    }

    public Field updateField(UUID id, Field fieldDetails) {
        Field existingField = fieldRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Field not found with id: " + id));

        boolean locationChanged = !existingField.getLocation().equals(fieldDetails.getLocation());

        existingField.setName(fieldDetails.getName());
        existingField.setLocation(fieldDetails.getLocation());
        existingField.setAreaHa(fieldDetails.getAreaHa());
        existingField.setSoilType(fieldDetails.getSoilType());

        Field savedField = fieldRepository.save(existingField);
        
        if (locationChanged) {
            weatherSyncService.deleteWeatherLogsForField(id);
            weatherSyncService.initializeFieldWeatherData(savedField);
        }

        return savedField;
    }

    public void deleteField(UUID id) {
        Field existingField = fieldRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Field not found with id: " + id));

        weatherSyncService.deleteWeatherLogsForField(id);
        fieldRepository.delete(existingField);
    }

    /**
     * Pair a physical ESP32 device (identified by its serial number)
     * to a field. Enforces the 1-to-1 rule.
     */
    public Field pairDevice(UUID fieldId, String deviceId) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Field not found with id: " + fieldId));

        com.solara.backend.entity.EspDevice espDevice = espDeviceRepository.findBySerialNumber(deviceId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Device with serial number '" + deviceId + "' not found in registry."));

        // 1-to-1 check: ensure no other field already has this device
        if (fieldRepository.existsByEspDevice_SerialNumber(deviceId)) {
            Field alreadyPaired = fieldRepository.findByEspDevice_SerialNumber(deviceId).get();
            if (!alreadyPaired.getId().equals(fieldId)) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "Device '" + deviceId + "' is already paired to another field.");
            }
        }

        field.setEspDevice(espDevice);
        return fieldRepository.save(field);
    }

    /**
     * Remove the device pairing from a field.
     */
    public Field unpairDevice(UUID fieldId) {
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Field not found with id: " + fieldId));
        field.setEspDevice(null);
        return fieldRepository.save(field);
    }

    public String getFieldName(UUID fieldId) {
        String fieldName = fieldRepository.findNameById(fieldId);

        if (fieldName == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "Field not found with id: " + fieldId);
        }

        return fieldName;
    }

    public long countFieldsByUserId(UUID userId) {
        return fieldRepository.countByUserId(userId);
    }
}
