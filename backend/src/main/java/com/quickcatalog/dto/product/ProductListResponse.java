package com.quickcatalog.dto.product;

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
public class ProductListResponse {
    private UUID id;
    private String name;
    private String sku;
    private String thumbnailUrl;
    private String categoryName;
    private BigDecimal mrp;
    private BigDecimal sellingPrice;
    private String gstRate;
    private String status;
    private BigDecimal currentStock;
    private Integer lowStockThreshold;
    private boolean trackInventory;
    private String[] tags;
    private LocalDateTime createdAt;
}
