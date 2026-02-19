package com.quickcatalog.repository;

import com.quickcatalog.entity.BulkImportJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BulkImportJobRepository extends JpaRepository<BulkImportJob, UUID> {

    Optional<BulkImportJob> findByIdAndTenantId(UUID id, UUID tenantId);

    List<BulkImportJob> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
