package com.solara.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.request.FieldDTO;
import com.solara.backend.dto.request.FieldPropertiesDTO;
import com.solara.backend.entity.Field;
import com.solara.backend.entity.FieldProperties;
import com.solara.backend.entity.User;
import com.solara.backend.service.FieldPropertyService;
import com.solara.backend.service.FieldService;

@RestController
@RequestMapping("/api/fields")
public class FieldController {

    private final FieldService fieldService;
    private final FieldPropertyService fieldPropertyService;

    public FieldController(FieldService fieldService, FieldPropertyService fieldPropertyService) {
        this.fieldService = fieldService;
        this.fieldPropertyService = fieldPropertyService;
    }

    // Create (POST)
    @PostMapping("/create-field")
    public ResponseEntity<Field> createField(
            @RequestBody FieldDTO field,
            @RequestBody FieldPropertiesDTO fieldProperties,
            @AuthenticationPrincipal User currentUser) {
                
        Field fieldEntity = field.toEntity();
        fieldEntity.setUserId(currentUser.getID());
        Field savedField = fieldService.createField(fieldEntity);

        if (fieldProperties != null) {
            fieldPropertyService.createFieldPropertiesWithFieldID(savedField.getId(), fieldProperties);
        }else {
            // If no properties provided, create default properties
            FieldProperties defaultProperties = new FieldProperties();
            defaultProperties.setFieldId(savedField.getId());
            fieldPropertyService.createFieldPropertiesWithFieldID(savedField.getId(), new FieldPropertiesDTO(defaultProperties));
        }

        return new ResponseEntity<>(savedField, HttpStatus.CREATED);
    }

    // Read All (GET)
    @GetMapping("/all")
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

    // Read All Paginated (GET)
    // Example usage: GET /api/fields/paginated?page=0&size=10
    @GetMapping("/paginated")
    public ResponseEntity<Page<Field>> getFieldsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<Field> fieldsPage = fieldService.getAllFieldsPaginated(page, size);
        return ResponseEntity.ok(fieldsPage);
    }

    // Get Field Properties (GET)
    @GetMapping("/get-properties-with-field-id/{id}")
    public ResponseEntity<FieldProperties> getPropertiesOfField(@PathVariable UUID id) {
        FieldProperties properties = fieldPropertyService.getFieldPropertiesByFieldId(id);
        if (properties == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(properties);
    }

    // Update (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<Field> updateFieldWithFieldId(@PathVariable UUID id, @RequestBody FieldDTO fieldDetails) {
        Field field = fieldService.updateField(id, fieldDetails.toEntity());
        return ResponseEntity.ok(field);
    }

    // Update Field Properties (PUT)
    @PutMapping("/field-properties/{id}")
    public ResponseEntity<FieldProperties> updateFieldProperties(@PathVariable UUID id, @RequestBody FieldPropertiesDTO properties) {
        FieldProperties updatedProperties = fieldPropertyService.updateFieldProperties(id, properties.toEntity());
        return ResponseEntity.ok(updatedProperties);
    }

    // Delete (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteField(@PathVariable UUID id) {
        fieldService.deleteField(id);
        return ResponseEntity.noContent().build();
    }
}
