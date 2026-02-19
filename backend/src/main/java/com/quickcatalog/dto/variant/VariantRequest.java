package com.quickcatalog.dto.variant;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class VariantRequest {
    @NotBlank(message = "Variant name is required")
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
    private Boolean isActive;
}
