package com.solara.backend.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.solara.backend.entity.AlertEvent;
import com.solara.backend.entity.AlertMetric;
import com.solara.backend.entity.AlertOperator;
import com.solara.backend.entity.AlertRule;
import com.solara.backend.entity.SensorLogs;
import com.solara.backend.repository.AlertEventRepository;
import com.solara.backend.repository.AlertRuleRepository;
import com.solara.backend.repository.FieldRepository;
import com.solara.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertEvaluationService {

    private final AlertRuleRepository alertRuleRepository;
    private final AlertEventRepository alertEventRepository;
    private final FieldRepository fieldRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public void evaluate(SensorLogs logEntry) {
        List<AlertRule> activeRules = alertRuleRepository.findByFieldIdAndActiveTrue(logEntry.getFieldId());
        
        for (AlertRule rule : activeRules) {
            try {
                Double value = extractMetric(logEntry, rule.getMetric());
                if (value == null) {
                    continue; // Metric not present in this log
                }

                boolean isBreaching = evaluateCondition(value, rule.getOperator(), rule.getThreshold());
                Optional<AlertEvent> openEventOpt = alertEventRepository.findByRuleIdAndResolvedAtIsNull(rule.getId());

                if (isBreaching) {
                    if (openEventOpt.isEmpty()) {
                        // First time breach - open a new event (in-app notification started, email delayed)
                        AlertEvent event = AlertEvent.builder()
                                .ruleId(rule.getId())
                                .fieldId(logEntry.getFieldId())
                                .ruleName(rule.getName())
                                .metric(rule.getMetric().name())
                                .threshold(rule.getThreshold())
                                .lastValue(value)
                                .triggeredAt(LocalDateTime.now())
                                .read(false) // Unread in-app
                                .build();
                        
                        alertEventRepository.save(event);
                        log.info("[Alerts] Rule breached, event started: rule={}, field={}", rule.getId(), rule.getFieldId());
                    } else {
                        // Ongoing breach
                        AlertEvent event = openEventOpt.get();
                        event.setLastValue(value);
                        
                        long minsSinceBreach = ChronoUnit.MINUTES.between(event.getTriggeredAt(), LocalDateTime.now());
                        
                        if (minsSinceBreach >= rule.getDurationMinutes() && event.getNotifiedAt() == null) {
                            // Duration elapsed -> fire email notification
                            if (rule.isNotifyEmail()) {
                                sendAlertEmail(rule, event, value);
                            }
                            event.setNotifiedAt(LocalDateTime.now());
                            log.info("[Alerts] Rule breached duration elapsed, notification fired: rule={}, field={}", rule.getId(), rule.getFieldId());
                        }
                        
                        // We also set read to false again if the breach is still ongoing and a new reading hits
                        // But normally a notification once sent should stay however the user left it.
                        // We'll leave `read` alone here so if they dismiss it while ongoing, it stays dismissed.
                        // Or we could pop it up again by setting read=false if they dismissed it before duration elapsed?
                        // Let's keep it simple: `read` was set to false at triggeredAt.
                        
                        alertEventRepository.save(event);
                    }
                } else {
                    // Condition is fine
                    if (openEventOpt.isPresent()) {
                        AlertEvent event = openEventOpt.get();
                        event.setResolvedAt(LocalDateTime.now());
                        event.setLastValue(value);
                        alertEventRepository.save(event);
                        log.info("[Alerts] Rule resolved: rule={}, field={}", rule.getId(), rule.getFieldId());
                    }
                }
            } catch (Exception e) {
                log.error("[Alerts] Failed to evaluate rule: {}", rule.getId(), e);
            }
        }
    }

    private Double extractMetric(SensorLogs log, AlertMetric metric) {
        return switch (metric) {
            case SOIL_HUMIDITY -> log.getSoilHumidity();
            case SOIL_TEMP -> log.getSoilTemp();
            case AMBIENT_TEMP -> log.getAmbientTemp();
            case AMBIENT_HUMIDITY -> log.getAmbientHumidity();
            case BATTERY_PERCENTAGE -> log.getBatteryPercentage() != null ? log.getBatteryPercentage().doubleValue() : null;
        };
    }

    private boolean evaluateCondition(double value, AlertOperator operator, double threshold) {
        if (operator == AlertOperator.BELOW) {
            return value < threshold;
        } else if (operator == AlertOperator.ABOVE) {
            return value > threshold;
        }
        return false;
    }

    private void sendAlertEmail(AlertRule rule, AlertEvent event, double latestValue) {
        fieldRepository.findById(rule.getFieldId()).ifPresent(field -> {
            userRepository.findById(rule.getUserId()).ifPresent(user -> {
                String lang = user.getPreferredLanguage() != null ? user.getPreferredLanguage().toLowerCase() : "en";
                String subject;
                String htmlBody;

                String metricName = rule.getMetric().name();
                String operatorName = rule.getOperator().name();

                if (lang.startsWith("tr")) {
                    subject = "Solara - Akıllı Uyarı: " + rule.getName();
                    htmlBody = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>"
                            + "<h2 style='color: #DD6B20;'> Akıllı Uyarı Tetiklendi</h2>"
                            + "<p>Merhaba,</p>"
                            + "<p><strong>" + field.getName() + "</strong> tarlası için tanımladığınız <strong>" + rule.getName() + "</strong> kuralı devreye girdi.</p>"
                            + "<div style='background-color: #FFF5F5; padding: 15px; border-radius: 8px; margin: 20px 0;'>"
                            + "<p style='margin:0;'><strong>Metrik:</strong> " + metricName + "</p>"
                            + "<p style='margin:0;'><strong>Durum:</strong> " + operatorName + " " + rule.getThreshold() + " (Devam Süresi: " + rule.getDurationMinutes() + " dk)</p>"
                            + "<p style='margin:0;'><strong>Güncel Değer:</strong> <span style='color: #E53E3E; font-weight: bold;'>" + latestValue + "</span></p>"
                            + "</div>"
                            + "<p>Lütfen tarlanızı kontrol ediniz.</p>"
                            + "<p>Teşekkürler,<br/>Solara Ekibi</p>"
                            + "</div>";
                } else {
                    subject = "Solara - Smart Alert: " + rule.getName();
                    htmlBody = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>"
                            + "<h2 style='color: #DD6B20;'> Smart Alert Triggered</h2>"
                            + "<p>Hello,</p>"
                            + "<p>The rule <strong>" + rule.getName() + "</strong> for field <strong>" + field.getName() + "</strong> has been triggered.</p>"
                            + "<div style='background-color: #FFF5F5; padding: 15px; border-radius: 8px; margin: 20px 0;'>"
                            + "<p style='margin:0;'><strong>Metric:</strong> " + metricName + "</p>"
                            + "<p style='margin:0;'><strong>Condition:</strong> " + operatorName + " " + rule.getThreshold() + " (Duration: " + rule.getDurationMinutes() + " min)</p>"
                            + "<p style='margin:0;'><strong>Current Value:</strong> <span style='color: #E53E3E; font-weight: bold;'>" + latestValue + "</span></p>"
                            + "</div>"
                            + "<p>Please check your field.</p>"
                            + "<p>Thanks,<br/>The Solara Team</p>"
                            + "</div>";
                }

                emailService.sendHtmlEmail(user.getEmail(), subject, htmlBody);
            });
        });
    }
}
