package com.quickcatalog.repository;

import com.quickcatalog.entity.AiGenerationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AiGenerationLogRepository extends JpaRepository<AiGenerationLog, UUID> {

    List<AiGenerationLog> findByTenantIdAndProductIdOrderByCreatedAtDesc(UUID tenantId, UUID productId);
}
