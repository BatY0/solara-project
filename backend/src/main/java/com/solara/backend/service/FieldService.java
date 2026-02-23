package com.solara.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.solara.backend.entity.Field;
import com.solara.backend.repository.FieldRepository;

public class FieldService {

    private final FieldRepository fieldRepository;

    public FieldService(FieldRepository fieldRepo) {
        this.fieldRepository = fieldRepo;
    }

    public Field createField(Field field) {
        return fieldRepository.save(field);
    }

    public List<Field> getAllFields() {
        return fieldRepository.findAll();
    }

    public Optional<Field> getFieldById(UUID id) {
        return fieldRepository.findById(id);
    }

    public Field updateField(UUID id, Field fieldDetails) {
        Field existingField = fieldRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Field not found with id: " + id));

        existingField.setName(fieldDetails.getName());
        existingField.setLatitude(fieldDetails.getLatitude());
        existingField.setLongitude(fieldDetails.getLongitude());
        existingField.setAreaHa(fieldDetails.getAreaHa());
        existingField.setSoilType(fieldDetails.getSoilType());

        return fieldRepository.save(existingField);
    }

    public void deleteField(UUID id) {
        Field existingField = fieldRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Field not found with id: " + id));
        fieldRepository.delete(existingField);
    }
}
