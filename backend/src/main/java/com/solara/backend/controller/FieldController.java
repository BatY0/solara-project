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
import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.dto.response.BasicResponse;
import com.solara.backend.dto.response.FieldResponseDTO;
import com.solara.backend.entity.Field;
import com.solara.backend.entity.FieldProperties;
import com.solara.backend.entity.User;
import com.solara.backend.exception.AppException;
import com.solara.backend.service.FieldPropertyService;
import com.solara.backend.service.FieldService;

@RestController
@RequestMapping("/api/v1/fields")
public class FieldController {

    private final FieldService fieldService;
    private final FieldPropertyService fieldPropertyService;

    public FieldController(FieldService fieldService, FieldPropertyService fieldPropertyService) {
        this.fieldService = fieldService;
        this.fieldPropertyService = fieldPropertyService;
    }

    // Create (POST)
    @PostMapping("/create-field")
    public ResponseEntity<?> createField(
            @RequestBody FieldDTO field,
            @AuthenticationPrincipal User currentUser) {
        
        Field fieldEntity;

        try {
            fieldEntity = field.toEntity();
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        fieldEntity.setUserId(currentUser.getID());
        fieldEntity = fieldService.createField(fieldEntity);
        
        BasicResponse fieldResponse = BasicResponse.builder()
                .id(fieldEntity.getId().toString())
                .name(fieldEntity.getName())
                .messageString("Field created successfully with provided values.")
                .build();

        FieldProperties defaultProperties = new FieldProperties();
        defaultProperties.setNitrogen(52.6);
        defaultProperties.setPhosphorus(58.1);
        defaultProperties.setPotassium(52.0);
        defaultProperties.setPh(6.44);

        defaultProperties.setFieldId(fieldEntity.getId());
        fieldPropertyService.createFieldPropertiesWithFieldID(fieldEntity.getId(), new FieldPropertiesDTO(defaultProperties));


        return new ResponseEntity<>(fieldResponse, HttpStatus.CREATED);
    }

    // Read All (GET)
    @GetMapping("/all")
    public ApiResponse<List<FieldResponseDTO>> getAllFields() {
        List<Field> fields = fieldService.getAllFields();
        List<FieldResponseDTO> fieldResponseDTOs = fields.stream()
                .map(FieldResponseDTO::new)
                .toList();
        return ApiResponse.success(fieldResponseDTOs, "Fields retrieved successfully.");
    }

    // Read One (GET)
    @GetMapping("/{id}")
    public ApiResponse<FieldResponseDTO> getFieldById(@PathVariable UUID id) {
        FieldResponseDTO fieldResponse = fieldService.getFieldById(id)
                .map(FieldResponseDTO::new)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Field with id " + id + " not found"));
        return ApiResponse.success(fieldResponse, "Field retrieved successfully."); 
    }

    // Read All Paginated (GET)
    // Example usage: GET /api/fields/paginated?page=0&size=10
    @GetMapping("/paginated")
    public ApiResponse<Page<FieldResponseDTO>> getFieldsPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<Field> fieldsPage = fieldService.getAllFieldsPaginated(page, size);
        Page<FieldResponseDTO> fieldResponseDTOPage = fieldsPage.map(FieldResponseDTO::new);
        
        ApiResponse<Page<FieldResponseDTO>> response = ApiResponse.success(
            fieldResponseDTOPage, "Fields retrieved successfully with pagination."
        );
        return response;
    }

    // Get Fields by User ID (GET)
    @GetMapping("/user-fields")
    public ApiResponse<List<FieldResponseDTO>> getFieldsByUserId(@AuthenticationPrincipal User currentUser) {
        List<Field> fields = fieldService.getFieldsByUserId(currentUser.getID());
        if (fields.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "No fields found for user with id: " + currentUser.getID());
        }

        List<FieldResponseDTO> fieldResponseDTOs = fields.stream()
                .map(FieldResponseDTO::new)
                .toList();

        return ApiResponse.success(fieldResponseDTOs, "Fields retrieved successfully for user.");
    }
    

    // Get Field Properties (GET)
    @GetMapping("/get-properties-with-field-id/{id}")
    public ApiResponse<FieldProperties> getPropertiesOfField(@PathVariable UUID id) {
        FieldProperties properties = fieldPropertyService.getFieldPropertiesByFieldId(id);
        if (properties == null) {
            throw new AppException(HttpStatus.NOT_FOUND, "No field properties found for field with id: " + id);
        }
        return ApiResponse.success(properties, "Field properties retrieved successfully.");
    }

    // Update (PUT)
    @PutMapping("/{id}")
    public ApiResponse<Field> updateFieldWithFieldId(@PathVariable UUID id, @RequestBody FieldDTO fieldDetails) {
        Field updatedField;

        try {
            updatedField = fieldService.updateField(id, fieldDetails.toEntity());
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        
        ApiResponse<Field> response = ApiResponse.success(
            updatedField, "Field with id " + id + " updated successfully"
        );

        return response;
    }

    // Update Field Properties (PUT)
    @PutMapping("/field-properties/{id}")
    public ApiResponse<FieldProperties> updateFieldProperties(@PathVariable UUID id, @RequestBody FieldPropertiesDTO properties) {
        FieldProperties updatedProperties = fieldPropertyService.updateFieldProperties(id, properties.toEntity());

        ApiResponse<FieldProperties> response = ApiResponse.success(
            updatedProperties, "Field Properties for field " + id + " updated successfully"
        );
        return response;
    }

    // Delete (DELETE)
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteField(@PathVariable UUID id) {
        fieldService.deleteField(id);

        ApiResponse<Void> response = ApiResponse.success(
            null, "Field with id " + id + " deleted successfully"
        );

        return response;
    }
}
