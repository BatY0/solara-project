package com.solara.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Solara - Your Verification Code");

            // Simple HTML template for the email
            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>"
                    + "<h2 style='color: #2F855A; text-align: center;'>Solara Account Verification</h2>"
                    + "<p>Hello,</p>"
                    + "<p>Please use the following 6-digit verification code to securely access or recover your Solara account. This code is valid for 15 minutes.</p>"
                    + "<div style='background-color: #F0FFF4; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;'>"
                    + "<h1 style='color: #276749; letter-spacing: 5px; margin: 0; font-size: 32px;'>" + code + "</h1>"
                    + "</div>"
                    + "<p style='color: #718096; font-size: 14px;'>If you did not request this code, please ignore this email.</p>"
                    + "<p>Thanks,<br/>The Solara Team</p>"
                    + "</div>";

            helper.setText(htmlContent, true);

            javaMailSender.send(message);
            log.info("Successfully sent verification email to {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send email to {}", to, e);
            throw new IllegalStateException("Failed to send verification email");
        }
    }
}
