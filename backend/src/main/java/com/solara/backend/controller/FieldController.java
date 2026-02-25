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
import com.solara.backend.dto.response.BasicResponse;
import com.solara.backend.dto.response.FieldResponseDTO;
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
    public ResponseEntity<BasicResponse> createField(
            @RequestBody FieldDTO field,
            @AuthenticationPrincipal User currentUser) {
                
        Field fieldEntity = field.toEntity();
        fieldEntity.setUserId(currentUser.getID());
        Field savedField = fieldService.createField(fieldEntity);
        
        BasicResponse fieldResponse = BasicResponse.builder()
                .id(savedField.getId().toString())
                .name(savedField.getName())
                .messageString("Field created successfully")
                .build();

        FieldProperties defaultProperties = new FieldProperties();
        defaultProperties.setFieldId(savedField.getId());
        fieldPropertyService.createFieldPropertiesWithFieldID(savedField.getId(), new FieldPropertiesDTO(defaultProperties));


        return new ResponseEntity<>(fieldResponse, HttpStatus.CREATED);
    }

    // Read All (GET)
    @GetMapping("/all")
    public ResponseEntity<List<FieldResponseDTO>> getAllFields() {
        List<Field> fields = fieldService.getAllFields();
        List<FieldResponseDTO> fieldResponseDTOs = fields.stream()
                .map(FieldResponseDTO::new)
                .toList();
        return ResponseEntity.ok(fieldResponseDTOs);
    }

    // Read One (GET)
    @GetMapping("/{id}")
    public ResponseEntity<FieldResponseDTO> getFieldById(@PathVariable UUID id) {
        return fieldService.getFieldById(id)
                .map(FieldResponseDTO::new)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Read All Paginated (GET)
    // Example usage: GET /api/fields/paginated?page=0&size=10
    @GetMapping("/paginated")
    public ResponseEntity<Page<FieldResponseDTO>> getFieldsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<Field> fieldsPage = fieldService.getAllFieldsPaginated(page, size);
        Page<FieldResponseDTO> fieldResponseDTOPage = fieldsPage.map(FieldResponseDTO::new);
        return ResponseEntity.ok(fieldResponseDTOPage);
    }

    // Get Fields by User ID (GET)
    @GetMapping("/user-fields")
    public ResponseEntity<List<FieldResponseDTO>> getFieldsByUserId(@AuthenticationPrincipal User currentUser) {
        List<Field> fields = fieldService.getFieldsByUserId(currentUser.getID());
        List<FieldResponseDTO> fieldResponseDTOs = fields.stream()
                .map(FieldResponseDTO::new)
                .toList();
        return ResponseEntity.ok(fieldResponseDTOs);
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
    public ResponseEntity<BasicResponse> updateFieldWithFieldId(@PathVariable UUID id, @RequestBody FieldDTO fieldDetails) {
        Field field = fieldService.updateField(id, fieldDetails.toEntity());
        BasicResponse fieldResponse = BasicResponse.builder()
                .id(field.getId().toString())
                .name(field.getName())
                .messageString("Field updated successfully")
                .build();
        return ResponseEntity.ok(fieldResponse);
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
