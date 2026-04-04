package com.solara.backend.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.solara.backend.entity.EspDevice;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EspDeviceResponseDTO {
    
    private UUID id;
    private String serialNumber;
    private String status;
    private String pairedFieldName;
    private UUID pairedFieldId;
    private LocalDateTime createdAt;
    
    public EspDeviceResponseDTO(EspDevice device) {
        this.id = device.getId();
        this.serialNumber = device.getSerialNumber();
        this.status = device.getStatus();
        if (device.getField() != null) {
            this.pairedFieldId = device.getField().getId();
            this.pairedFieldName = device.getField().getName();
        }
        this.createdAt = device.getCreatedAt();
    }
}
