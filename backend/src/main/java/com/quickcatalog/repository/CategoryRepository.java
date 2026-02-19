package com.quickcatalog.repository;

import com.quickcatalog.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByTenantIdAndParentIsNullAndIsActiveTrueOrderBySortOrder(UUID tenantId);

    List<Category> findByTenantIdAndIsActiveTrueOrderBySortOrder(UUID tenantId);

    Optional<Category> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByTenantIdAndIsActiveTrue(UUID tenantId);
}
