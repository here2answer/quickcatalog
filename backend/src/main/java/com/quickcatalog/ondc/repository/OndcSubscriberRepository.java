package com.quickcatalog.ondc.repository;

import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.OndcEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OndcSubscriberRepository extends JpaRepository<OndcSubscriber, UUID> {

    Optional<OndcSubscriber> findByTenantIdAndEnvironment(UUID tenantId, OndcEnvironment environment);

    Optional<OndcSubscriber> findBySubscriberId(String subscriberId);

    Optional<OndcSubscriber> findByTenantId(UUID tenantId);

    boolean existsByTenantIdAndEnvironment(UUID tenantId, OndcEnvironment environment);
}
