package com.quickcatalog.entity;

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
@Table(name = "product_variant")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "product_id", insertable = false, updatable = false)
    private UUID productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "variant_name")
    private String variantName;

    @Column(name = "sku")
    private String sku;

    @Column(name = "barcode_value")
    private String barcodeValue;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes", columnDefinition = "jsonb")
    private String attributes;

    @Column(name = "mrp")
    private BigDecimal mrp;

    @Column(name = "selling_price")
    private BigDecimal sellingPrice;

    @Column(name = "cost_price")
    private BigDecimal costPrice;

    @Column(name = "current_stock")
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(name = "weight_grams")
    private BigDecimal weightGrams;

    @Column(name = "image_id")
    private UUID imageId;

    @Column(name = "is_active")
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
