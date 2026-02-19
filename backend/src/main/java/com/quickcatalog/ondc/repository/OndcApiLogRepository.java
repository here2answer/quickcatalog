package com.quickcatalog.ondc.repository;

import com.quickcatalog.ondc.entity.OndcApiLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OndcApiLogRepository extends JpaRepository<OndcApiLog, UUID> {

    Page<OndcApiLog> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<OndcApiLog> findByTenantIdAndActionOrderByCreatedAtDesc(UUID tenantId, String action, Pageable pageable);

    Page<OndcApiLog> findByTransactionIdOrderByCreatedAtDesc(String transactionId, Pageable pageable);
}
