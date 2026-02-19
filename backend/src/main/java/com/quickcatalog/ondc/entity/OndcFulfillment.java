package com.quickcatalog.ondc.entity;

import com.quickcatalog.ondc.entity.enums.FulfillmentState;
import com.quickcatalog.ondc.entity.enums.FulfillmentType;
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
@Table(name = "ondc_fulfillment")
public class OndcFulfillment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ondc_order_id", nullable = false)
    private UUID ondcOrderId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "fulfillment_type", columnDefinition = "fulfillment_type")
    private FulfillmentType fulfillmentType = FulfillmentType.DELIVERY;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "fulfillment_state", columnDefinition = "fulfillment_state")
    private FulfillmentState fulfillmentState = FulfillmentState.PENDING;

    @Column(name = "tracking_url", length = 500)
    private String trackingUrl;

    @Column(name = "agent_name")
    private String agentName;

    @Column(name = "agent_phone", length = 15)
    private String agentPhone;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "delivery_address", columnDefinition = "jsonb")
    private String deliveryAddress;

    @Column(name = "delivery_gps", length = 50)
    private String deliveryGps;

    @Column(name = "promised_delivery_start")
    private LocalDateTime promisedDeliveryStart;

    @Column(name = "promised_delivery_end")
    private LocalDateTime promisedDeliveryEnd;

    @Column(name = "actual_delivery_at")
    private LocalDateTime actualDeliveryAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
