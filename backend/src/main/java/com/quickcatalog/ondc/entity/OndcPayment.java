package com.quickcatalog.ondc.entity;

import com.quickcatalog.ondc.entity.enums.PaymentType;
import com.quickcatalog.ondc.entity.enums.SettlementStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "ondc_payment")
public class OndcPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ondc_order_id", nullable = false)
    private UUID ondcOrderId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "payment_type", columnDefinition = "payment_type")
    private PaymentType paymentType = PaymentType.PRE_PAID;

    @Column(name = "collected_by", length = 10)
    private String collectedBy;

    @Column(name = "buyer_app_finder_fee_type", length = 20)
    private String buyerAppFinderFeeType;

    @Column(name = "buyer_app_finder_fee_amount", precision = 12, scale = 2)
    private BigDecimal buyerAppFinderFeeAmount;

    @Column(name = "settlement_basis", length = 50)
    private String settlementBasis;

    @Column(name = "settlement_window", length = 20)
    private String settlementWindow;

    @Column(name = "settlement_amount", precision = 12, scale = 2)
    private BigDecimal settlementAmount;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "settlement_status", columnDefinition = "settlement_status")
    private SettlementStatus settlementStatus = SettlementStatus.PENDING;

    @Column(name = "payment_uri", length = 500)
    private String paymentUri;

    @Column(name = "transaction_id")
    private String transactionId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
