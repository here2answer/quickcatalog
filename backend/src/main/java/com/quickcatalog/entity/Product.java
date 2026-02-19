package com.quickcatalog.entity;

import com.quickcatalog.entity.enums.BarcodeType;
import com.quickcatalog.entity.enums.GstRate;
import com.quickcatalog.entity.enums.ProductStatus;
import com.quickcatalog.entity.enums.UnitType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "name")
    private String name;

    @Column(name = "slug")
    private String slug;

    @Column(name = "short_description")
    private String shortDescription;

    @Column(name = "long_description")
    private String longDescription;

    @Column(name = "brand")
    private String brand;

    @Column(name = "manufacturer")
    private String manufacturer;

    @Column(name = "hsn_code")
    private String hsnCode;

    @Column(name = "sac_code")
    private String sacCode;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "gst_rate", columnDefinition = "gst_rate")
    private GstRate gstRate;

    @Column(name = "sku")
    private String sku;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "barcode_type", columnDefinition = "barcode_type")
    private BarcodeType barcodeType;

    @Column(name = "barcode_value")
    private String barcodeValue;

    @Column(name = "mrp")
    private BigDecimal mrp;

    @Column(name = "selling_price")
    private BigDecimal sellingPrice;

    @Column(name = "cost_price")
    private BigDecimal costPrice;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "unit", columnDefinition = "unit_type")
    private UnitType unit;

    @Column(name = "weight_grams")
    private BigDecimal weightGrams;

    @Column(name = "length_cm")
    private BigDecimal lengthCm;

    @Column(name = "width_cm")
    private BigDecimal widthCm;

    @Column(name = "height_cm")
    private BigDecimal heightCm;

    @Column(name = "track_inventory")
    private boolean trackInventory;

    @Column(name = "current_stock")
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "low_stock_threshold")
    private Integer lowStockThreshold;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_attributes", columnDefinition = "jsonb")
    private String customAttributes;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @Column(name = "seo_title")
    private String seoTitle;

    @Column(name = "seo_description")
    private String seoDescription;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "seo_keywords", columnDefinition = "text[]")
    private String[] seoKeywords;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", columnDefinition = "product_status")
    private ProductStatus status;

    @Column(name = "is_featured")
    private boolean isFeatured;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ProductImage> images;
}
