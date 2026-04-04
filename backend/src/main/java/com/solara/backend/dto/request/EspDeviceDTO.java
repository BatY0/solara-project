package com.solara.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EspDeviceDTO {
    
    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    @NotBlank(message = "Status is required")
    private String status;
}
