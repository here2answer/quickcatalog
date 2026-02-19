package com.quickcatalog.dto.variant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantResponse {
    private UUID id;
    private UUID productId;
    private String variantName;
    private String sku;
    private String barcodeValue;
    private String attributes;
    private BigDecimal mrp;
    private BigDecimal sellingPrice;
    private BigDecimal costPrice;
    private BigDecimal currentStock;
    private BigDecimal weightGrams;
    private UUID imageId;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
