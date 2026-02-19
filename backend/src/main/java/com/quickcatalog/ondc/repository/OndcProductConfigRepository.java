package com.quickcatalog.ondc.repository;

import com.quickcatalog.ondc.entity.OndcProductConfig;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OndcProductConfigRepository extends JpaRepository<OndcProductConfig, UUID> {

    Optional<OndcProductConfig> findByProductId(UUID productId);

    Optional<OndcProductConfig> findByProductIdAndTenantId(UUID productId, UUID tenantId);

    List<OndcProductConfig> findByTenantIdAndPublishedToOndcTrue(UUID tenantId);

    Page<OndcProductConfig> findByTenantIdAndPublishedToOndcTrue(UUID tenantId, Pageable pageable);

    @Query("SELECT c FROM OndcProductConfig c WHERE c.tenantId = :tenantId AND c.publishedToOndc = true AND c.ondcDomain = :domain")
    List<OndcProductConfig> findPublishedByDomain(@Param("tenantId") UUID tenantId, @Param("domain") String domain);

    boolean existsByProductId(UUID productId);

    long countByTenantIdAndPublishedToOndcTrue(UUID tenantId);
}
