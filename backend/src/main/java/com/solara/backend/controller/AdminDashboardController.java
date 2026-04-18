package com.solara.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.solara.backend.dto.response.AdminDashboardStatsDTO;
import com.solara.backend.dto.response.ApiResponse;
import com.solara.backend.dto.response.UserDTO;
import com.solara.backend.entity.User;
import com.solara.backend.repository.EspDeviceRepository;
import com.solara.backend.service.FieldService;
import com.solara.backend.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    public record UserDetail (
        UserDTO user,
        long deviceCount,
        long fieldCount
    ) {}

    public record UserDashboardResponse (
        Page<UserDetail> users,
        long totalUsers
    ) {}

    private final UserService userService;
    private final FieldService fieldService;
    private final EspDeviceRepository espDeviceRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/list-users")
    public ApiResponse<UserDashboardResponse> getGlobalStats(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        Page<User> users = userService.listUsersPaginated(page, size);
        Page<UserDTO> userDTOs = users.map(user -> UserDTO.builder()
                .id(user.getID())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .role(user.getRole())
                .preferredLanguage(user.getPreferredLanguage())
                .createdAt(user.getCreatedAt())
                .build());

        Page<UserDetail> userDetails = userDTOs.map(user -> {
            UserDTO userDTO = UserDTO.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .surname(user.getSurname())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .preferredLanguage(user.getPreferredLanguage())
                    .createdAt(user.getCreatedAt())
                    .build();
            long deviceCount = espDeviceRepository.countByField_UserId(userDTO.getId());
            long fieldCount = fieldService.countFieldsByUserId(userDTO.getId());
            return new UserDetail(userDTO, deviceCount, fieldCount);
        });

        long totalUsers = userService.countUsers();

        UserDashboardResponse response = new UserDashboardResponse(userDetails, totalUsers);

        return ApiResponse.success(response, HttpStatus.OK.value(), "Users retrieved successfully.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{user_id}/update-role")
    public ApiResponse<String> updateUserRole(@PathVariable("user_id") UUID userId, @RequestBody String newRole) {
        userService.updateUserRole(userId, newRole);        
        return ApiResponse.success(userId.toString() + " role updated to " + newRole, HttpStatus.OK.value(), "User role updated successfully.");
    }
    
}
