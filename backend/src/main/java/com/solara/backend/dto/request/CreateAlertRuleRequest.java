package com.solara.backend.dto.request;

import java.util.UUID;

import com.solara.backend.entity.AlertMetric;
import com.solara.backend.entity.AlertOperator;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateAlertRuleRequest {

    @NotNull(message = "fieldId is required")
    private UUID fieldId;

    @NotBlank(message = "Rule name is required")
    @Size(max = 150)
    private String name;

    @NotNull(message = "metric is required")
    private AlertMetric metric;

    @NotNull(message = "operator is required")
    private AlertOperator operator;

    @NotNull(message = "threshold is required")
    private Double threshold;

    /** Minimum duration in minutes before a notification is sent (e.g. 120 = 2 hours) */
    @NotNull(message = "durationMinutes is required")
    @Positive
    private Integer durationMinutes;

    private boolean notifyEmail = true;

    private boolean active = true;
}
