package com.solara.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.OneToOne;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "field_properties")
@Data 
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldProperties {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "field_id", nullable = false)
    @OneToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @JoinColumn(name = "field_id", referencedColumnName = "id", updatable = false)
    private UUID fieldId;

    @Column(name = "nitrogen")
    private Double nitrogen;

    @Column(name = "phosphorus")
    private Double phosphorus;

    @Column(name = "potassium")
    private Double potassium;

    @Column(name = "ph")
    private Double ph;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
