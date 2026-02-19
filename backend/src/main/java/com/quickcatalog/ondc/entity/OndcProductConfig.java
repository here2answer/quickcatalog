package com.quickcatalog.ondc.entity;

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
@Table(name = "ondc_product_config")
public class OndcProductConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "ondc_domain")
    private String ondcDomain;

    @Column(name = "ondc_category_id")
    private String ondcCategoryId;

    @Column(name = "time_to_ship")
    private String timeToShip;

    @Column(name = "returnable")
    private Boolean returnable;

    @Column(name = "cancellable")
    private Boolean cancellable;

    @Column(name = "return_window")
    private String returnWindow;

    @Column(name = "seller_pickup_return")
    private boolean sellerPickupReturn = true;

    @Column(name = "cod_available")
    private Boolean codAvailable;

    @Column(name = "max_order_quantity")
    private Integer maxOrderQuantity;

    @Column(name = "country_of_origin")
    private String countryOfOrigin = "IND";

    @Column(name = "is_veg")
    private Boolean isVeg;

    @Column(name = "is_non_veg")
    private Boolean isNonVeg;

    @Column(name = "is_egg")
    private Boolean isEgg;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "statutory_info", columnDefinition = "jsonb")
    private String statutoryInfo;

    @Column(name = "published_to_ondc")
    private boolean publishedToOndc = false;

    @Column(name = "last_published_at")
    private LocalDateTime lastPublishedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
