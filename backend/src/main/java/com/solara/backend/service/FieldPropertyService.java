package com.solara.backend.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.FieldPropertiesDTO;
import com.solara.backend.entity.FieldProperties;
import com.solara.backend.exception.AppException;
import com.solara.backend.repository.FieldPropertiesRepository;

@Service
public class FieldPropertyService {
    private final FieldPropertiesRepository fieldPropertiesRepository;

    public FieldPropertyService(FieldPropertiesRepository fieldPropertiesRepository) {
        this.fieldPropertiesRepository = fieldPropertiesRepository;
    }

    public FieldProperties createFieldPropertiesWithFieldID(UUID fieldId, FieldPropertiesDTO properties) {
        FieldProperties fieldProperties = properties.toEntity();
        fieldProperties.setFieldId(fieldId);
        return fieldPropertiesRepository.save(fieldProperties);
    }

    public FieldProperties getFieldPropertiesByFieldId(UUID fieldId) {
        return fieldPropertiesRepository.findByFieldId(fieldId).orElse(null);
    }

    public FieldProperties updateFieldProperties(UUID fieldID, FieldProperties properties) {
        FieldProperties existingProperties = fieldPropertiesRepository.findByFieldId(fieldID).orElse(null);
        if (existingProperties == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "Field properties not found for field id: " + fieldID);
        }

        LocalDateTime now = LocalDateTime.now();

        existingProperties.setNitrogen(properties.getNitrogen());
        existingProperties.setPhosphorus(properties.getPhosphorus());
        existingProperties.setPotassium(properties.getPotassium());
        existingProperties.setPh(properties.getPh());
        existingProperties.setUpdatedAt(now);

        return fieldPropertiesRepository.save(existingProperties);
    }

}
