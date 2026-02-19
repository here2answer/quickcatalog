package com.quickcatalog.dto.product;

import com.quickcatalog.channel.dto.ListingSummaryResponse;
import com.quickcatalog.dto.image.ImageUploadResponse;
import com.quickcatalog.dto.variant.VariantResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private String name;
    private String slug;
    private UUID categoryId;
    private String categoryName;
    private String brand;
    private String manufacturer;
    private String sku;
    private String shortDescription;
    private String longDescription;
    private String hsnCode;
    private String sacCode;
    private String gstRate;
    private String barcodeType;
    private String barcodeValue;
    private BigDecimal mrp;
    private BigDecimal sellingPrice;
    private BigDecimal costPrice;
    private String unit;
    private BigDecimal weightGrams;
    private BigDecimal lengthCm;
    private BigDecimal widthCm;
    private BigDecimal heightCm;
    private boolean trackInventory;
    private BigDecimal currentStock;
    private Integer lowStockThreshold;
    private String customAttributes;
    private String[] tags;
    private String seoTitle;
    private String seoDescription;
    private String[] seoKeywords;
    private String status;
    private boolean featured;
    private List<ImageUploadResponse> images;
    private List<VariantResponse> variants;
    private List<ListingSummaryResponse> channelListings;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
