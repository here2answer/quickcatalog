package com.quickcatalog.ondc.seller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.quickcatalog.ondc.entity.enums.OndcOrderState;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderListResponse {
    private UUID id;
    private String becknOrderId;
    private OndcOrderState state;
    private int itemCount;
    private BigDecimal totalAmount;
    private String buyerName;
    private String buyerPhone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
