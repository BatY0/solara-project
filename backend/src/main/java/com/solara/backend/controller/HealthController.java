package com.solara.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/status")
    public Map<String, String> getSystemStatus() {
        HashMap<String, String> status = new HashMap<>();
        status.put("system", "Solara Backend");
        status.put("status", "ONLINE");
        status.put("version", "1.0.0-SNAPSHOT");
        return status;
    }
}
