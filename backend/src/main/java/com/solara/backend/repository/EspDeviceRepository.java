package com.solara.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import com.solara.backend.entity.EspDevice;

public interface EspDeviceRepository extends JpaRepository<EspDevice, UUID> {
    Optional<EspDevice> findBySerialNumber(String serialNumber);
    boolean existsBySerialNumber(String serialNumber);
}
