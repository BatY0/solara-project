package com.solara.backend.controller;

import com.solara.backend.entity.Field;
import com.solara.backend.service.FieldService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.solara.backend.dto.request.FieldDTO;

@RestController
@RequestMapping("/api/fields")
public class FieldController {

    private final FieldService fieldService;

    public FieldController(FieldService fieldService) {
        this.fieldService = fieldService;
    }

    // Create (POST)
    @PostMapping
    public ResponseEntity<Field> createField(@RequestBody FieldDTO field) {
        Field savedField = fieldService.createField(field.toEntity());
        return new ResponseEntity<>(savedField, HttpStatus.CREATED);
    }

    // Read All (GET)
    @GetMapping
    public ResponseEntity<List<Field>> getAllFields() {
        List<Field> fields = fieldService.getAllFields();
        return ResponseEntity.ok(fields);
    }

    // Read One (GET)
    @GetMapping("/{id}")
    public ResponseEntity<Field> getFieldById(@PathVariable UUID id) {
        return fieldService.getFieldById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<Field> updateField(@PathVariable UUID id, @RequestBody FieldDTO fieldDetails) {
        Field field = fieldService.updateField(id, fieldDetails.toEntity());
        return ResponseEntity.ok(field);
    }

    // Delete (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteField(@PathVariable UUID id) {
        fieldService.deleteField(id);
        return ResponseEntity.noContent().build();
    }
}
