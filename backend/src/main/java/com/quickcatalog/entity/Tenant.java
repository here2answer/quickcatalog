package com.quickcatalog.entity;

import com.quickcatalog.entity.enums.AiProvider;
import com.quickcatalog.entity.enums.SubscriptionPlan;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "tenant")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "gstin")
    private String gstin;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "default_currency")
    private String defaultCurrency = "INR";

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "subscription_plan", columnDefinition = "subscription_plan")
    private SubscriptionPlan subscriptionPlan;

    @Column(name = "subscription_valid_until")
    private LocalDateTime subscriptionValidUntil;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "ai_provider", columnDefinition = "ai_provider")
    private AiProvider aiProvider = AiProvider.OLLAMA;

    @Column(name = "openai_api_key")
    private String openaiApiKey;

    @Column(name = "is_active")
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
