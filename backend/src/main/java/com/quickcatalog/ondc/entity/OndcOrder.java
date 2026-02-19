package com.quickcatalog.ondc.entity;

import com.quickcatalog.ondc.entity.enums.OndcOrderState;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "ondc_order")
public class OndcOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "ondc_provider_id")
    private UUID ondcProviderId;

    @Column(name = "beckn_order_id", unique = true, nullable = false)
    private String becknOrderId;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "bap_id", length = 500)
    private String bapId;

    @Column(name = "bap_uri", length = 500)
    private String bapUri;

    @Column(name = "domain", length = 20)
    private String domain;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "state", nullable = false, columnDefinition = "ondc_order_state")
    private OndcOrderState state = OndcOrderState.CREATED;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items", columnDefinition = "jsonb")
    private String items;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "billing", columnDefinition = "jsonb")
    private String billing;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fulfillment", columnDefinition = "jsonb")
    private String fulfillment;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payment", columnDefinition = "jsonb")
    private String payment;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "quote", columnDefinition = "jsonb")
    private String quote;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "cancelled_by", length = 20)
    private String cancelledBy;

    @Column(name = "billing_name")
    private String billingName;

    @Column(name = "billing_phone", length = 15)
    private String billingPhone;

    @Column(name = "billing_email")
    private String billingEmail;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "billing_address", columnDefinition = "jsonb")
    private String billingAddress;

    @OneToMany(mappedBy = "ondcOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OndcOrderItem> orderItems = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
