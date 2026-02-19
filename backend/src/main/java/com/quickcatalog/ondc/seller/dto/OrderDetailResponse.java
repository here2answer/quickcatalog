package com.quickcatalog.ondc.seller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonRawValue;
import com.quickcatalog.ondc.entity.enums.FulfillmentState;
import com.quickcatalog.ondc.entity.enums.FulfillmentType;
import com.quickcatalog.ondc.entity.enums.OndcOrderState;
import com.quickcatalog.ondc.entity.enums.PaymentType;
import com.quickcatalog.ondc.entity.enums.SettlementStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderDetailResponse {
    private UUID id;
    private String becknOrderId;
    private OndcOrderState state;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Billing info
    private String billingName;
    private String billingPhone;
    private String billingEmail;
    @JsonRawValue
    private String billingAddress;

    // Normalized items
    private List<OrderItemResponse> items;

    // Fulfillment summary
    private FulfillmentSummary fulfillment;

    // Payment summary
    private PaymentSummary payment;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OrderItemResponse {
        private UUID id;
        private UUID productId;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal taxAmount;
        private BigDecimal totalAmount;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FulfillmentSummary {
        private UUID id;
        private FulfillmentType type;
        private FulfillmentState state;
        private String trackingUrl;
        private String agentName;
        private String agentPhone;
        @JsonRawValue
        private String deliveryAddress;
        private String deliveryGps;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PaymentSummary {
        private UUID id;
        private PaymentType type;
        private String collectedBy;
        private String transactionId;
        private SettlementStatus settlementStatus;
        private BigDecimal buyerAppFinderFeeAmount;
    }
}
