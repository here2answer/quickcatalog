package com.quickcatalog.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "product_image")
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "original_url")
    private String originalUrl;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "medium_url")
    private String mediumUrl;

    @Column(name = "large_url")
    private String largeUrl;

    @Column(name = "alt_text")
    private String altText;

    @Column(name = "is_primary")
    private boolean isPrimary;

    @Column(name = "sort_order")
    private int sortOrder;

    @Column(name = "bg_removed_url")
    private String bgRemovedUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
