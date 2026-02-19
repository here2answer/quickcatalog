package com.quickcatalog.repository;

import com.quickcatalog.entity.ActivityLog;
import com.quickcatalog.entity.enums.ActionType;
import com.quickcatalog.entity.enums.EntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findTop20ByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    Page<ActivityLog> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<ActivityLog> findByTenantIdAndEntityTypeOrderByCreatedAtDesc(UUID tenantId, EntityType entityType, Pageable pageable);

    Page<ActivityLog> findByTenantIdAndActionOrderByCreatedAtDesc(UUID tenantId, ActionType action, Pageable pageable);

    Page<ActivityLog> findByTenantIdAndEntityTypeAndActionOrderByCreatedAtDesc(UUID tenantId, EntityType entityType, ActionType action, Pageable pageable);
}
