package com.solara.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.dto.response.AuthResponse;
import com.solara.backend.dto.response.EspDeviceResponseDTO;
import com.solara.backend.dto.response.FieldResponseDTO;
import com.solara.backend.dto.response.UserDTO;
import com.solara.backend.entity.Field;
import com.solara.backend.entity.User;
import com.solara.backend.repository.EspDeviceRepository;
import com.solara.backend.service.AnalysisService;
import com.solara.backend.service.FieldService;
import com.solara.backend.service.SensorLogsService;
import com.solara.backend.service.UserService;
import com.solara.backend.service.AuthService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    public record UserDetail (
        UserDTO user,
        long deviceCount,
        long fieldCount,
        long analysisCount,
        long sensorLogsCount
    ) {}

    public record UserDashboardResponse (
        Page<UserDetail> users,
        long totalUsers
    ) {}

    public record FieldWithDeviceDTO(
        FieldResponseDTO field,
        EspDeviceResponseDTO device
    ) {}

    public record FieldWithDeviceResponse(
        UserDTO user,
        List<FieldWithDeviceDTO> fields,
        long totalFields,
        long totalDevices,
        long totalSensorLogs,
        long totalAnalysisLogs
    ) {}

    public record StatsResponse(
        long totalUsers,
        long totalFields,
        long totalDevices,
        long totalAnalysisLogs,
        long totalSensorLogs
    ) {}

    private final UserService userService;
    private final FieldService fieldService;
    private final EspDeviceRepository espDeviceRepository;
    private final AnalysisService analysisService;
    private final SensorLogsService sensorLogsService;
    private final AuthService authService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/list-users")
    public ApiResponse<UserDashboardResponse> getGlobalStats(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Page<User> users = userService.listUsersPaginated(page, size);

        Page<UserDetail> userDetails = users.map(user -> {
            UserDTO userDTO = UserDTO.builder()
                    .id(user.getID())
                    .name(user.getName())
                    .surname(user.getSurname())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .preferredLanguage(user.getPreferredLanguage())
                    .createdAt(user.getCreatedAt())
                    .build();
            long deviceCount = espDeviceRepository.countByField_UserId(userDTO.getId());
            long fieldCount = fieldService.countFieldsByUserId(userDTO.getId());
            long analysisCount = analysisService.countAnalysisLogsForUser(userDTO.getId());
            long sensorLogsCount = sensorLogsService.countLogsForUser(userDTO.getId());
            return new UserDetail(userDTO, deviceCount, fieldCount, analysisCount, sensorLogsCount);
        });

        long totalUsers = userService.countUsers();

        UserDashboardResponse response = new UserDashboardResponse(userDetails, totalUsers);

        return ApiResponse.success(response, HttpStatus.OK.value(), "Users retrieved successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{user_id}/update-role")
    public ApiResponse<String> updateUserRole(@PathVariable("user_id") UUID userId, @RequestBody String newRole) {
        String cleanRole = newRole.replaceAll("^\"|\"$", "");
        
        userService.updateUserRole(userId, cleanRole);        
        return ApiResponse.success(userId.toString() + " role updated to " + cleanRole, HttpStatus.OK.value(), "User role updated successfully.");
   }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{user_id}/details")
    public ApiResponse<FieldWithDeviceResponse> getUserDetailedInfo(@PathVariable("user_id") UUID userId) {
        User user = userService.getUserById(userId);
        UserDTO userDTO = UserDTO.builder()
                .id(user.getID())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .role(user.getRole())
                .preferredLanguage(user.getPreferredLanguage())
                .createdAt(user.getCreatedAt())
                .build();
        List<Field> userFields = fieldService.getFieldsByUserId(userId);

        List<FieldWithDeviceDTO> response = userFields.stream().map(field -> {
            FieldResponseDTO fieldDTO = new FieldResponseDTO(field);
            EspDeviceResponseDTO deviceDTO = field.getEspDevice() != null 
                ? new EspDeviceResponseDTO(field.getEspDevice()) 
                : null;
                
            return new FieldWithDeviceDTO(fieldDTO, deviceDTO);
        }).toList();

        long deviceCount = espDeviceRepository.countByField_UserId(userId);
        long fieldCount = fieldService.countFieldsByUserId(userId);
        long analysisCount = analysisService.countAnalysisLogsForUser(userId);
        long sensorLogsCount = sensorLogsService.countLogsForUser(userId);

        FieldWithDeviceResponse fullResponse = new FieldWithDeviceResponse(userDTO, response, fieldCount, deviceCount, sensorLogsCount, analysisCount);
        
        return ApiResponse.success(fullResponse, HttpStatus.OK.value(), "User details retrieved successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/stats")
    public ApiResponse<StatsResponse> getStats() {
        long totalUsers = userService.countUsers();
        long totalFields = fieldService.countAllFields();
        long totalDevices = espDeviceRepository.count();
        long totalAnalysisLogs = analysisService.countAnalysisLogs();
        long totalSensorLogs = sensorLogsService.countLogs();

        StatsResponse stats = new StatsResponse(totalUsers, totalFields, totalDevices, totalAnalysisLogs, totalSensorLogs);

        return ApiResponse.success(stats, HttpStatus.OK.value(), "Statistics retrieved successfully.");
    } 

    
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/delete-user/{id}")
    public ResponseEntity<AuthResponse> deleteUser(@PathVariable("id") UUID id) {
        authService.deleteUser(id);
        return ResponseEntity.ok(AuthResponse.builder().message("User deleted successfully.").build());
    }
    
}
