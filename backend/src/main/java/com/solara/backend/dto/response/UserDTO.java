package com.solara.backend.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.solara.backend.entity.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private UUID id;
    private String name;
    private String surname;
    private String email;
    private Role role;
    private LocalDateTime createdAt;
}
