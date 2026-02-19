package com.quickcatalog.entity;

import com.quickcatalog.entity.enums.AiGenerationType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "ai_generation_log")
public class AiGenerationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "product_id")
    private UUID productId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "generation_type", columnDefinition = "ai_generation_type")
    private AiGenerationType generationType;

    @Column(name = "input_prompt")
    private String inputPrompt;

    @Column(name = "generated_output")
    private String generatedOutput;

    @Column(name = "model_used")
    private String modelUsed;

    @Column(name = "accepted")
    private boolean accepted;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
