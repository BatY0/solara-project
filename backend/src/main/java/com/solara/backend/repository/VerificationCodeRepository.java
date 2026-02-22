package com.solara.backend.repository;

import com.solara.backend.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    Optional<VerificationCode> findByEmailAndCode(String email, String code);

    // Custom query to delete old codes if user requests multiple times
    void deleteByEmail(String email);
}
