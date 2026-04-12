package com.solara.backend.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.solara.backend.entity.ChatThread;

@Repository
public interface ChatThreadRepository extends JpaRepository<ChatThread, UUID> {
}