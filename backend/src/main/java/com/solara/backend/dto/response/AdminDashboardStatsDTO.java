package com.solara.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardStatsDTO {
    private long totalUsers;
    private long totalDevices;
}
