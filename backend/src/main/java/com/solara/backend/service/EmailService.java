package com.solara.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.solara.backend.exception.AppException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendVerificationCode(String to, String code, String language) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            boolean isTr = "tr".equalsIgnoreCase(language);
            String subject = isTr ? "Solara - Doğrulama Kodunuz" : "Solara - Your Verification Code";
            helper.setSubject(subject);

            String title = isTr ? "Solara Hesap Doğrulama" : "Solara Account Verification";
            String greeting = isTr ? "Merhaba," : "Hello,";
            String text = isTr 
                ? "Solara hesabınıza güvenli bir şekilde erişmek veya hesabınızı kurtarmak için lütfen aşağıdaki 6 haneli doğrulama kodunu kullanın. Bu kod 15 dakika boyunca geçerlidir."
                : "Please use the following 6-digit verification code to securely access or recover your Solara account. This code is valid for 15 minutes.";
            String ignoreText = isTr ? "Eğer bu kodu siz istemediyseniz, lütfen bu e-postayı dikkate almayın." : "If you did not request this code, please ignore this email.";
            String signoff = isTr ? "Teşekkürler,<br/>Solara Ekibi" : "Thanks,<br/>The Solara Team";

            // Simple HTML template for the email
            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>"
                    + "<h2 style='color: #2F855A; text-align: center;'>" + title + "</h2>"
                    + "<p>" + greeting + "</p>"
                    + "<p>" + text + "</p>"
                    + "<div style='background-color: #F0FFF4; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;'>"
                    + "<h1 style='color: #276749; letter-spacing: 5px; margin: 0; font-size: 32px;'>" + code + "</h1>"
                    + "</div>"
                    + "<p style='color: #718096; font-size: 14px;'>" + ignoreText + "</p>"
                    + "<p>" + signoff + "</p>"
                    + "</div>";

            helper.setText(htmlContent, true);

            javaMailSender.send(message);
            log.info("Successfully sent verification email to {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send email to {}", to, e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to send verification email");
        }
    }

    /**
     * Generic HTML email sender — used for offline device alerts and any future notifications.
     */
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            javaMailSender.send(message);
            log.info("Successfully sent email '{}' to {}", subject, to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}", to, e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to send email: " + subject);
        }
    }

    @Async
    public void sendAccountDeletionCode(String to, String code, String language) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            boolean isTr = "tr".equalsIgnoreCase(language);
            String subject = isTr ? "Solara - Hesap Silme Doğrulaması" : "Solara - Account Deletion Verification";
            helper.setSubject(subject);

            String title = isTr ? "Solara Hesap Silme İşlemi" : "Solara Account Deletion";
            String greeting = isTr ? "Merhaba," : "Hello,";
            String text1 = isTr 
                ? "Solara hesabınızı silme talebinde bulundunuz. Bu işlem <strong>geri alınamaz</strong> ve tüm tarlalarınızı, verilerinizi kalıcı olarak silecektir."
                : "You have requested to delete your Solara account. This action is <strong>irreversible</strong> and will permanently delete all your fields and data.";
            String text2 = isTr 
                ? "Bu işlemi onaylamak için lütfen aşağıdaki 6 haneli doğrulama kodunu kullanın. Bu kod 15 dakika boyunca geçerlidir."
                : "To confirm this action, please use the following 6-digit verification code. This code is valid for 15 minutes.";
            String ignoreText = isTr 
                ? "Eğer hesabınızı silmeyi talep etmediyseniz, lütfen bu e-postayı dikkate almayın. Hesabınız güvende kalacaktır."
                : "If you did not request to delete your account, please ignore this email and your account will remain safe.";
            String signoff = isTr ? "Teşekkürler,<br/>Solara Ekibi" : "Thanks,<br/>The Solara Team";

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>"
                    + "<h2 style='color: #C53030; text-align: center;'>" + title + "</h2>"
                    + "<p>" + greeting + "</p>"
                    + "<p>" + text1 + "</p>"
                    + "<p>" + text2 + "</p>"
                    + "<div style='background-color: #FFF5F5; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;'>"
                    + "<h1 style='color: #9B2C2C; letter-spacing: 5px; margin: 0; font-size: 32px;'>" + code + "</h1>"
                    + "</div>"
                    + "<p style='color: #718096; font-size: 14px;'>" + ignoreText + "</p>"
                    + "<p>" + signoff + "</p>"
                    + "</div>";

            helper.setText(htmlContent, true);

            javaMailSender.send(message);
            log.info("Successfully sent account deletion verification email to {}", to);

        } catch (MessagingException e) {
            log.error("Failed to send account deletion email to {}", to, e);
            throw new IllegalStateException("Failed to send account deletion verification email");
        }
    }
}

