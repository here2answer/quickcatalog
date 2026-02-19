package com.quickcatalog.ondc.entity;

import com.quickcatalog.ondc.entity.enums.OndcEnvironment;
import com.quickcatalog.ondc.entity.enums.RegistrationStatus;
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
@Table(name = "ondc_subscriber")
public class OndcSubscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "subscriber_id")
    private String subscriberId;

    @Column(name = "subscriber_url")
    private String subscriberUrl;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "environment", columnDefinition = "ondc_environment")
    private OndcEnvironment environment;

    @Column(name = "signing_public_key", columnDefinition = "TEXT")
    private String signingPublicKey;

    @Column(name = "signing_private_key", columnDefinition = "TEXT")
    private String signingPrivateKey;

    @Column(name = "encryption_public_key", columnDefinition = "TEXT")
    private String encryptionPublicKey;

    @Column(name = "encryption_private_key", columnDefinition = "TEXT")
    private String encryptionPrivateKey;

    @Column(name = "unique_key_id")
    private String uniqueKeyId;

    @Column(name = "domain")
    private String domain;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "city_codes", columnDefinition = "text[]")
    private String[] cityCodes;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "registration_status", columnDefinition = "registration_status")
    private RegistrationStatus registrationStatus;

    @Column(name = "last_subscribe_at")
    private LocalDateTime lastSubscribeAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
