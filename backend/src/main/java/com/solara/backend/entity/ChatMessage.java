package com.solara.backend.entity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, updatable = false)
    private UUID threadId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatRole role;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    @Column(name = "crop_ids", columnDefinition = "UUID[]")
    private List<UUID> cropIds;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ChatRole {
        user,
        chatbot
    }
}