package com.quickcatalog.repository;

import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findByIdAndTenantId(UUID id, UUID tenantId);

    Page<Product> findByTenantIdAndStatusNot(UUID tenantId, ProductStatus status, Pageable pageable);

    Page<Product> findByTenantIdAndStatus(UUID tenantId, ProductStatus status, Pageable pageable);

    Page<Product> findByTenantIdAndCategoryIdAndStatusNot(UUID tenantId, UUID categoryId, ProductStatus status, Pageable pageable);

    Page<Product> findByTenantIdAndCategoryIdAndStatus(UUID tenantId, UUID categoryId, ProductStatus status, Pageable pageable);

    @Query(value = "SELECT * FROM product WHERE tenant_id = :tenantId AND search_vector @@ plainto_tsquery('english', :query) AND status != 'ARCHIVED'",
            countQuery = "SELECT count(*) FROM product WHERE tenant_id = :tenantId AND search_vector @@ plainto_tsquery('english', :query) AND status != 'ARCHIVED'",
            nativeQuery = true)
    Page<Product> fullTextSearch(@Param("tenantId") UUID tenantId, @Param("query") String query, Pageable pageable);

    @Query(value = "SELECT * FROM product WHERE tenant_id = :tenantId AND name ILIKE '%' || :query || '%' AND status != 'ARCHIVED'",
            countQuery = "SELECT count(*) FROM product WHERE tenant_id = :tenantId AND name ILIKE '%' || :query || '%' AND status != 'ARCHIVED'",
            nativeQuery = true)
    Page<Product> fuzzySearch(@Param("tenantId") UUID tenantId, @Param("query") String query, Pageable pageable);

    Optional<Product> findByTenantIdAndBarcodeValue(UUID tenantId, String barcodeValue);

    @Query("SELECT p FROM Product p WHERE p.tenantId = :tenantId AND p.trackInventory = true AND p.currentStock <= p.lowStockThreshold AND p.status != 'ARCHIVED'")
    List<Product> findLowStock(@Param("tenantId") UUID tenantId);

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndStatus(UUID tenantId, ProductStatus status);

    boolean existsByTenantIdAndSlug(UUID tenantId, String slug);

    boolean existsByTenantIdAndSku(UUID tenantId, String sku);

    List<Product> findByTenantIdAndStatusNotOrderByCreatedAtDesc(UUID tenantId, ProductStatus status, Pageable pageable);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.images WHERE p.id = :id AND p.tenantId = :tenantId")
    Optional<Product> findByIdAndTenantIdWithImages(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    // Duplicate detection - name similarity using pg_trgm
    @Query(value = """
            SELECT p.* FROM product p
            WHERE p.tenant_id = :tenantId
            AND p.id != :productId
            AND p.status != 'ARCHIVED'
            AND similarity(p.name, :name) > :threshold
            ORDER BY similarity(p.name, :name) DESC
            LIMIT 20
            """, nativeQuery = true)
    List<Product> findSimilarByName(
            @Param("tenantId") UUID tenantId,
            @Param("productId") UUID productId,
            @Param("name") String name,
            @Param("threshold") double threshold);

    // Duplicate detection - exact SKU match
    @Query(value = """
            SELECT p.* FROM product p
            WHERE p.tenant_id = :tenantId
            AND p.id != :excludeId
            AND p.sku = :sku
            AND p.status != 'ARCHIVED'
            """, nativeQuery = true)
    List<Product> findBySameSku(
            @Param("tenantId") UUID tenantId,
            @Param("excludeId") UUID excludeId,
            @Param("sku") String sku);

    // Dashboard catalog health queries
    @Query(value = "SELECT COUNT(DISTINCT p.id) FROM product p JOIN product_image pi ON p.id = pi.product_id WHERE p.tenant_id = :tenantId AND p.status != 'ARCHIVED'", nativeQuery = true)
    long countProductsWithImages(@Param("tenantId") UUID tenantId);

    @Query(value = "SELECT COUNT(*) FROM product WHERE tenant_id = :tenantId AND status != 'ARCHIVED' AND short_description IS NOT NULL AND short_description != ''", nativeQuery = true)
    long countProductsWithDescriptions(@Param("tenantId") UUID tenantId);

    @Query(value = "SELECT COUNT(*) FROM product WHERE tenant_id = :tenantId AND status != 'ARCHIVED' AND seo_title IS NOT NULL AND seo_title != ''", nativeQuery = true)
    long countProductsWithSeo(@Param("tenantId") UUID tenantId);

    @Query(value = "SELECT COUNT(*) FROM product WHERE tenant_id = :tenantId AND status != 'ARCHIVED' AND barcode_value IS NOT NULL AND barcode_value != ''", nativeQuery = true)
    long countProductsWithBarcode(@Param("tenantId") UUID tenantId);

    @Query(value = "SELECT COUNT(*) FROM product WHERE tenant_id = :tenantId AND status != 'ARCHIVED' AND hsn_code IS NOT NULL AND hsn_code != ''", nativeQuery = true)
    long countProductsWithHsn(@Param("tenantId") UUID tenantId);
}
