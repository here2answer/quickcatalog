package com.quickcatalog.ondc.repository;

import com.quickcatalog.ondc.entity.OndcProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OndcProviderRepository extends JpaRepository<OndcProvider, UUID> {

    List<OndcProvider> findByTenantIdAndIsActiveTrue(UUID tenantId);

    List<OndcProvider> findByTenantId(UUID tenantId);

    Optional<OndcProvider> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<OndcProvider> findByProviderId(String providerId);

    boolean existsByTenantIdAndProviderId(UUID tenantId, String providerId);
}
