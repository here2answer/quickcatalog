package com.quickcatalog.channel.entity;

import com.quickcatalog.channel.entity.enums.ListingStatus;
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
@Table(name = "product_channel_listing")
public class ProductChannelListing {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "channel_id")
    private UUID channelId;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "listing_status", columnDefinition = "listing_status")
    private ListingStatus listingStatus = ListingStatus.NOT_LISTED;

    @Column(name = "external_listing_id")
    private String externalListingId;

    @Column(name = "external_url")
    private String externalUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "channel_specific_data", columnDefinition = "jsonb")
    private String channelSpecificData;

    @Column(name = "channel_price")
    private BigDecimal channelPrice;

    @Column(name = "channel_compare_price")
    private BigDecimal channelComparePrice;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Column(name = "sync_error", columnDefinition = "TEXT")
    private String syncError;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
