package com.solara.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.solara.backend.entity.Field;
import com.solara.backend.entity.User;
import com.solara.backend.repository.FieldRepository;
import com.solara.backend.repository.SensorLogsRepository;
import com.solara.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Runs an hourly cron job to detect ESP32 devices that have gone offline.
 * A device is considered offline if its paired field has received no sensor
 * data in the last 24 hours.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceMonitorService {

    private final FieldRepository fieldRepository;
    private final SensorLogsRepository sensorLogsRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * Cron expression: "0 0 * * * *" = top of every hour.
     * For testing you can change this to "0 * * * * *" (every minute).
     */
    @Scheduled(cron = "0 0 * * * *")
    public void checkOfflineDevices() {
        log.info("[DeviceMonitor] Running hourly offline device check...");

        LocalDateTime threshold = LocalDateTime.now().minusHours(24);

        // Get all fields that have a device paired
        List<Field> pairedFields = fieldRepository.findAll().stream()
                .filter(f -> f.getEspDevice() != null && !f.getEspDevice().getSerialNumber().isBlank())
                .toList();

        for (Field field : pairedFields) {
            boolean hasRecentData = sensorLogsRepository
                    .existsByFieldIdAndTimestampAfter(field.getId(), threshold);

            if (!hasRecentData) {
                // Only send alert if we haven't already sent one for this specific offline event
                if (field.getLastOfflineAlertSentAt() == null) {
                    log.warn("[DeviceMonitor] Field '{}' (device='{}') has been OFFLINE for 24h. Sending alert.",
                            field.getName(), field.getEspDevice().getSerialNumber());

                    // Send alert to the field owner
                    userRepository.findById(field.getUserId()).ifPresent(user -> {
                        sendOfflineAlert(user, field);
                        field.setLastOfflineAlertSentAt(LocalDateTime.now());
                        fieldRepository.save(field);
                    });
                }
            } else {
                // Device is online. If we had previously sent an alert, reset the tracker
                if (field.getLastOfflineAlertSentAt() != null) {
                    log.info("[DeviceMonitor] Field '{}' is back online. Resetting alert tracker.", field.getName());
                    field.setLastOfflineAlertSentAt(null);
                    fieldRepository.save(field);
                }
            }
        }

        log.info("[DeviceMonitor] Offline device check complete.");
    }

    private void sendOfflineAlert(User user, Field field) {
        String lang = user.getPreferredLanguage() != null ? user.getPreferredLanguage().toLowerCase() : "en";
        String subject;
        String htmlBody;

        if (lang.startsWith("tr")) {
            subject = "Solara - Cihaz Çevrimdışı Uyarısı: " + field.getName();
            htmlBody = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"
                    + "padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>"
                    + "<h2 style='color: #C53030;'> Cihaz Çevrimdışı Uyarısı</h2>"
                    + "<p>Merhaba,</p>"
                    + "<p><strong>" + field.getName() + "</strong> tarlası ile eşleşen <strong>" + field.getEspDevice().getSerialNumber() + "</strong> seri numaralı cihazınız son 24 saattir veri göndermedi.</p>"
                    + "<p>Lütfen cihazınızın açık ve WiFi ağına bağlı olduğundan emin olun.</p>"
                    + "<p>Teşekkürler,<br/>Solara Ekibi</p>"
                    + "</div>";
        } else {
            subject = "Solara - Device Offline Alert: " + field.getName();
            htmlBody = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"
                    + "padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>"
                    + "<h2 style='color: #C53030;'> Device Offline Alert</h2>"
                    + "<p>Hello,</p>"
                    + "<p>Your device <strong>" + field.getEspDevice().getSerialNumber() + "</strong> paired to field "
                    + "<strong>" + field.getName() + "</strong> has not sent any data in the last 24 hours.</p>"
                    + "<p>Please check that your device is powered on and connected to WiFi.</p>"
                    + "<p>Thanks,<br/>The Solara Team</p>"
                    + "</div>";
        }

        emailService.sendHtmlEmail(user.getEmail(), subject, htmlBody);
    }
}
