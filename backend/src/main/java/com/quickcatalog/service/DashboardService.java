package com.quickcatalog.service;

import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.enums.ListingStatus;
import com.quickcatalog.channel.repository.ChannelRepository;
import com.quickcatalog.channel.repository.ProductChannelListingRepository;
import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.dashboard.CatalogHealthResponse;
import com.quickcatalog.dto.dashboard.ChannelStatusResponse;
import com.quickcatalog.dto.dashboard.DashboardSummaryResponse;
import com.quickcatalog.dto.dashboard.RecentActivityResponse;
import com.quickcatalog.entity.ActivityLog;
import com.quickcatalog.entity.Category;
import com.quickcatalog.entity.enums.ProductStatus;
import com.quickcatalog.repository.ActivityLogRepository;
import com.quickcatalog.repository.CategoryRepository;
import com.quickcatalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ChannelRepository channelRepository;
    private final ProductChannelListingRepository channelListingRepository;
    private final CategoryRepository categoryRepository;

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

    public List<ChannelStatusResponse> getChannelStatus() {
        UUID tenantId = TenantContext.getTenantId();
        List<Channel> channels = channelRepository.findByTenantId(tenantId);

        return channels.stream().map(ch -> {
            long live = channelListingRepository.countByChannelIdAndListingStatus(ch.getId(), ListingStatus.LIVE);
            long pending = channelListingRepository.countByChannelIdAndListingStatus(ch.getId(), ListingStatus.PENDING);
            long error = channelListingRepository.countByChannelIdAndListingStatus(ch.getId(), ListingStatus.ERROR);
            return ChannelStatusResponse.builder()
                    .channelId(ch.getId())
                    .channelName(ch.getChannelName())
                    .channelType(ch.getChannelType() != null ? ch.getChannelType().name() : null)
                    .liveCount(live)
                    .pendingCount(pending)
                    .errorCount(error)
                    .totalListings(live + pending + error)
                    .build();
        }).collect(Collectors.toList());
    }

    public CatalogHealthResponse getCatalogHealth() {
        UUID tenantId = TenantContext.getTenantId();

        long total = productRepository.countByTenantId(tenantId);
        long withImages = productRepository.countProductsWithImages(tenantId);
        long withDesc = productRepository.countProductsWithDescriptions(tenantId);
        long withSeo = productRepository.countProductsWithSeo(tenantId);
        long withBarcode = productRepository.countProductsWithBarcode(tenantId);
        long withHsn = productRepository.countProductsWithHsn(tenantId);

        int completeness = total == 0 ? 0 :
                (int) ((withImages + withDesc + withSeo + withBarcode + withHsn) * 100 / (total * 5));

        // Status distribution
        Map<String, Long> statusDist = new LinkedHashMap<>();
        for (ProductStatus status : ProductStatus.values()) {
            long count = productRepository.countByTenantIdAndStatus(tenantId, status);
            if (count > 0) {
                statusDist.put(status.name(), count);
            }
        }

        // Category distribution (top categories)
        Map<String, Long> categoryDist = new LinkedHashMap<>();
        List<Category> categories = categoryRepository.findByTenantIdAndIsActiveTrueOrderBySortOrder(tenantId);
        for (Category cat : categories) {
            long count = productRepository.findByTenantIdAndCategoryIdAndStatusNot(
                    tenantId, cat.getId(), ProductStatus.ARCHIVED,
                    org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
            if (count > 0) {
                categoryDist.put(cat.getName(), count);
            }
        }

        return CatalogHealthResponse.builder()
                .totalProducts(total)
                .productsWithImages(withImages)
                .productsWithDescriptions(withDesc)
                .productsWithSeo(withSeo)
                .productsWithBarcode(withBarcode)
                .productsWithHsn(withHsn)
                .completenessPercent(completeness)
                .statusDistribution(statusDist)
                .categoryDistribution(categoryDist)
                .build();
    }
}
