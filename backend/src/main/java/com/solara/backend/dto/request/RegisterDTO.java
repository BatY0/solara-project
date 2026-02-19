package com.solara.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterDTO {
    @NotBlank(message="Name is required")
    private String name;

    @NotBlank(message="Surname is required")
    private String surname;

    @NotBlank(message="Email is required")
    @Email(message="Email should be valid")
    private String email;

    @NotBlank(message="Password is required")
    @Size(min=8, message="Password must be at least 8 characters long")
    private String password;
}

