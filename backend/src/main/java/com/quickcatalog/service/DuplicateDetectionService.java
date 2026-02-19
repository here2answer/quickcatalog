package com.quickcatalog.service;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.product.DuplicateGroupResponse;
import com.quickcatalog.dto.product.DuplicateMatchResponse;
import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.enums.ProductStatus;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DuplicateDetectionService {

    private final ProductRepository productRepository;

    private static final double SIMILARITY_THRESHOLD = 0.4;

    public DuplicateGroupResponse findDuplicates(UUID productId) {
        UUID tenantId = TenantContext.getTenantId();
        Product product = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        List<DuplicateMatchResponse> matches = new ArrayList<>();

        // Name similarity matches
        List<Product> nameMatches = productRepository.findSimilarByName(
                tenantId, productId, product.getName(), SIMILARITY_THRESHOLD);
        for (Product m : nameMatches) {
            matches.add(DuplicateMatchResponse.builder()
                    .id(m.getId())
                    .name(m.getName())
                    .sku(m.getSku())
                    .status(m.getStatus() != null ? m.getStatus().name() : null)
                    .matchType("NAME_SIMILAR")
                    .similarityScore(0.0) // score from DB not easily available, mark as similar
                    .build());
        }

        // SKU exact matches
        if (product.getSku() != null && !product.getSku().isBlank()) {
            List<Product> skuMatches = productRepository.findBySameSku(
                    tenantId, productId, product.getSku());
            Set<UUID> nameMatchIds = nameMatches.stream().map(Product::getId).collect(Collectors.toSet());
            for (Product m : skuMatches) {
                if (!nameMatchIds.contains(m.getId())) {
                    matches.add(DuplicateMatchResponse.builder()
                            .id(m.getId())
                            .name(m.getName())
                            .sku(m.getSku())
                            .status(m.getStatus() != null ? m.getStatus().name() : null)
                            .matchType("SKU_EXACT")
                            .similarityScore(1.0)
                            .build());
                }
            }
        }

        return DuplicateGroupResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .productSku(product.getSku())
                .matches(matches)
                .build();
    }

    public List<DuplicateGroupResponse> scanForDuplicates() {
        UUID tenantId = TenantContext.getTenantId();
        List<Product> allProducts = productRepository
                .findByTenantIdAndStatusNot(tenantId, ProductStatus.ARCHIVED, Pageable.unpaged())
                .getContent();

        Set<UUID> processed = new HashSet<>();
        List<DuplicateGroupResponse> groups = new ArrayList<>();

        for (Product product : allProducts) {
            if (processed.contains(product.getId())) continue;

            List<DuplicateMatchResponse> matches = new ArrayList<>();

            // Name similarity
            List<Product> nameMatches = productRepository.findSimilarByName(
                    tenantId, product.getId(), product.getName(), SIMILARITY_THRESHOLD);
            for (Product m : nameMatches) {
                if (!processed.contains(m.getId())) {
                    matches.add(DuplicateMatchResponse.builder()
                            .id(m.getId())
                            .name(m.getName())
                            .sku(m.getSku())
                            .status(m.getStatus() != null ? m.getStatus().name() : null)
                            .matchType("NAME_SIMILAR")
                            .similarityScore(0.0)
                            .build());
                }
            }

            // SKU exact matches
            if (product.getSku() != null && !product.getSku().isBlank()) {
                List<Product> skuMatches = productRepository.findBySameSku(
                        tenantId, product.getId(), product.getSku());
                Set<UUID> nameMatchIds = nameMatches.stream().map(Product::getId).collect(Collectors.toSet());
                for (Product m : skuMatches) {
                    if (!processed.contains(m.getId()) && !nameMatchIds.contains(m.getId())) {
                        matches.add(DuplicateMatchResponse.builder()
                                .id(m.getId())
                                .name(m.getName())
                                .sku(m.getSku())
                                .status(m.getStatus() != null ? m.getStatus().name() : null)
                                .matchType("SKU_EXACT")
                                .similarityScore(1.0)
                                .build());
                    }
                }
            }

            if (!matches.isEmpty()) {
                groups.add(DuplicateGroupResponse.builder()
                        .productId(product.getId())
                        .productName(product.getName())
                        .productSku(product.getSku())
                        .matches(matches)
                        .build());

                processed.add(product.getId());
                matches.forEach(m -> processed.add(m.getId()));
            }
        }

        return groups;
    }
}
