package com.quickcatalog.service;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.dashboard.DashboardSummaryResponse;
import com.quickcatalog.dto.dashboard.RecentActivityResponse;
import com.quickcatalog.entity.ActivityLog;
import com.quickcatalog.entity.enums.ProductStatus;
import com.quickcatalog.repository.ActivityLogRepository;
import com.quickcatalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final ActivityLogRepository activityLogRepository;

    public DashboardSummaryResponse getSummary() {
        UUID tenantId = TenantContext.getTenantId();

        long total = productRepository.countByTenantId(tenantId);
        long active = productRepository.countByTenantIdAndStatus(tenantId, ProductStatus.ACTIVE);
        long draft = productRepository.countByTenantIdAndStatus(tenantId, ProductStatus.DRAFT);
        long inactive = productRepository.countByTenantIdAndStatus(tenantId, ProductStatus.INACTIVE);
        long lowStock = productRepository.findLowStock(tenantId).size();

        return DashboardSummaryResponse.builder()
                .totalProducts(total)
                .activeProducts(active)
                .draftProducts(draft)
                .inactiveProducts(inactive)
                .lowStockProducts(lowStock)
                .build();
    }

    public List<RecentActivityResponse> getRecentActivity() {
        UUID tenantId = TenantContext.getTenantId();
        List<ActivityLog> logs = activityLogRepository.findTop20ByTenantIdOrderByCreatedAtDesc(tenantId);

        return logs.stream()
                .map(log -> RecentActivityResponse.builder()
                        .id(log.getId())
                        .entityType(log.getEntityType() != null ? log.getEntityType().name() : null)
                        .entityId(log.getEntityId())
                        .action(log.getAction() != null ? log.getAction().name() : null)
                        .details(log.getDetails())
                        .createdAt(log.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
