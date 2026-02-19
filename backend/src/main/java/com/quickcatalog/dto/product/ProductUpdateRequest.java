package com.quickcatalog.dto.product;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProductUpdateRequest {
    private String name;
    private UUID categoryId;
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
    private Boolean trackInventory;
    private BigDecimal currentStock;
    private Integer lowStockThreshold;
    private String customAttributes;
    private String[] tags;
    private String seoTitle;
    private String seoDescription;
    private String[] seoKeywords;
    private Boolean isFeatured;
}
