 package com.solara.backend.service;

import java.util.List;
import java.util.Optional;
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

    public FieldService(FieldRepository fieldRepo) {
        this.fieldRepository = fieldRepo;
    }

    @Transactional
    public Field createField(Field field) {
        Field savedField = fieldRepository.save(field);
        return savedField;
    }

    public List<Field> getAllFields() {
        return fieldRepository.findAll();
    }

    public Page<Field> getAllFieldsPaginated(int page, int size) {
        Pageable pageable = Pageable.ofSize(size).withPage(page);
        return fieldRepository.findAll(pageable);
    }
 
    public Optional<Field> getFieldById(UUID id) {
        return fieldRepository.findById(id);
    }

    public List<Field> getFieldsByUserId(UUID userId) {
        return fieldRepository.findByUserId(userId);
    }

    public Field updateField(UUID id, Field fieldDetails) {
        Field existingField = fieldRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Field not found with id: " + id));

        existingField.setName(fieldDetails.getName());
        existingField.setLocation(fieldDetails.getLocation());
        existingField.setAreaHa(fieldDetails.getAreaHa());
        existingField.setSoilType(fieldDetails.getSoilType());

        return fieldRepository.save(existingField);
    }

    public void deleteField(UUID id) {
        Field existingField = fieldRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Field not found with id: " + id));
        fieldRepository.delete(existingField);
    }
}
