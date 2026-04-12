package com.solara.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.solara.backend.entity.ChatMessage;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    // Now we fetch history by specific thread rather than all user messages
    List<ChatMessage> findByThreadIdOrderByCreatedAtAsc(UUID threadId);
    List<ChatMessage> findTop10ByThreadIdOrderByCreatedAtDesc(UUID threadId);
}