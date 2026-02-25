package com.solara.backend.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.solara.backend.dto.request.FieldPropertiesDTO;
import com.solara.backend.entity.FieldProperties;
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

    public FieldProperties updateFieldProperties(UUID propertyId, FieldProperties properties) {
        FieldProperties existingProperties = fieldPropertiesRepository.findById(propertyId).orElse(null);
        if (existingProperties == null) {
            throw new RuntimeException("Field properties not found for property id: " + propertyId);
        }

        existingProperties.setNitrogen(properties.getNitrogen());
        existingProperties.setPhosphorus(properties.getPhosphorus());
        existingProperties.setPotassium(properties.getPotassium());
        existingProperties.setPh(properties.getPh());

        return fieldPropertiesRepository.save(existingProperties);
    }

}
