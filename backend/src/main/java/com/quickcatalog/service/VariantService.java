package com.quickcatalog.service;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.variant.VariantGenerateRequest;
import com.quickcatalog.dto.variant.VariantRequest;
import com.quickcatalog.dto.variant.VariantResponse;
import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.ProductVariant;
import com.quickcatalog.entity.enums.ActionType;
import com.quickcatalog.entity.enums.EntityType;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.repository.ProductRepository;
import com.quickcatalog.repository.ProductVariantRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final ActivityLogService activityLogService;
    private final ObjectMapper objectMapper;

    public List<VariantResponse> list(UUID productId) {
        UUID tenantId = TenantContext.getTenantId();
        verifyProductOwnership(productId, tenantId);

        return variantRepository.findByProductIdOrderByCreatedAtAsc(productId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public VariantResponse getById(UUID productId, UUID variantId) {
        UUID tenantId = TenantContext.getTenantId();
        verifyProductOwnership(productId, tenantId);

        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant", "id", variantId));
        return mapToResponse(variant);
    }

    @Transactional
    public VariantResponse create(UUID productId, VariantRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();
        Product product = verifyProductOwnership(productId, tenantId);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setVariantName(req.getVariantName());
        variant.setSku(req.getSku());
        variant.setBarcodeValue(req.getBarcodeValue());
        variant.setAttributes(req.getAttributes());
        variant.setMrp(req.getMrp() != null ? req.getMrp() : product.getMrp());
        variant.setSellingPrice(req.getSellingPrice() != null ? req.getSellingPrice() : product.getSellingPrice());
        variant.setCostPrice(req.getCostPrice() != null ? req.getCostPrice() : product.getCostPrice());
        if (req.getCurrentStock() != null) variant.setCurrentStock(req.getCurrentStock());
        variant.setWeightGrams(req.getWeightGrams() != null ? req.getWeightGrams() : product.getWeightGrams());
        variant.setImageId(req.getImageId());
        if (req.getIsActive() != null) variant.setActive(req.getIsActive());

        variant = variantRepository.save(variant);

        activityLogService.log(tenantId, userId, EntityType.PRODUCT, productId,
                ActionType.UPDATED, "{\"variant_created\":\"" + variant.getVariantName() + "\"}");

        return mapToResponse(variant);
    }

    @Transactional
    public VariantResponse update(UUID productId, UUID variantId, VariantRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();
        verifyProductOwnership(productId, tenantId);

        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant", "id", variantId));

        if (req.getVariantName() != null) variant.setVariantName(req.getVariantName());
        if (req.getSku() != null) variant.setSku(req.getSku());
        if (req.getBarcodeValue() != null) variant.setBarcodeValue(req.getBarcodeValue());
        if (req.getAttributes() != null) variant.setAttributes(req.getAttributes());
        if (req.getMrp() != null) variant.setMrp(req.getMrp());
        if (req.getSellingPrice() != null) variant.setSellingPrice(req.getSellingPrice());
        if (req.getCostPrice() != null) variant.setCostPrice(req.getCostPrice());
        if (req.getCurrentStock() != null) variant.setCurrentStock(req.getCurrentStock());
        if (req.getWeightGrams() != null) variant.setWeightGrams(req.getWeightGrams());
        if (req.getImageId() != null) variant.setImageId(req.getImageId());
        if (req.getIsActive() != null) variant.setActive(req.getIsActive());

        variant = variantRepository.save(variant);

        activityLogService.log(tenantId, userId, EntityType.PRODUCT, productId,
                ActionType.UPDATED, "{\"variant_updated\":\"" + variant.getVariantName() + "\"}");

        return mapToResponse(variant);
    }

    @Transactional
    public void delete(UUID productId, UUID variantId) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();
        verifyProductOwnership(productId, tenantId);

        ProductVariant variant = variantRepository.findByIdAndProductId(variantId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant", "id", variantId));

        variantRepository.delete(variant);

        activityLogService.log(tenantId, userId, EntityType.PRODUCT, productId,
                ActionType.UPDATED, "{\"variant_deleted\":\"" + variant.getVariantName() + "\"}");
    }

    @Transactional
    public List<VariantResponse> generateVariants(UUID productId, VariantGenerateRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();
        Product product = verifyProductOwnership(productId, tenantId);

        Map<String, List<String>> combos = req.getAttributeCombinations();
        List<Map<String, String>> cartesianProduct = cartesianProduct(combos);

        List<VariantResponse> results = new ArrayList<>();

        for (Map<String, String> attrCombo : cartesianProduct) {
            String variantName = String.join(" - ", attrCombo.values());
            String attributesJson;
            try {
                attributesJson = objectMapper.writeValueAsString(attrCombo);
            } catch (JsonProcessingException e) {
                attributesJson = "{}";
            }

            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setVariantName(variantName);
            variant.setAttributes(attributesJson);
            variant.setMrp(product.getMrp());
            variant.setSellingPrice(product.getSellingPrice());
            variant.setCostPrice(product.getCostPrice());
            variant.setWeightGrams(product.getWeightGrams());

            variant = variantRepository.save(variant);
            results.add(mapToResponse(variant));
        }

        activityLogService.log(tenantId, userId, EntityType.PRODUCT, productId,
                ActionType.UPDATED, "{\"variants_generated\":" + results.size() + "}");

        return results;
    }

    // --- Private helpers ---

    private Product verifyProductOwnership(UUID productId, UUID tenantId) {
        return productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
    }

    private VariantResponse mapToResponse(ProductVariant variant) {
        return VariantResponse.builder()
                .id(variant.getId())
                .productId(variant.getProductId())
                .variantName(variant.getVariantName())
                .sku(variant.getSku())
                .barcodeValue(variant.getBarcodeValue())
                .attributes(variant.getAttributes())
                .mrp(variant.getMrp())
                .sellingPrice(variant.getSellingPrice())
                .costPrice(variant.getCostPrice())
                .currentStock(variant.getCurrentStock())
                .weightGrams(variant.getWeightGrams())
                .imageId(variant.getImageId())
                .active(variant.isActive())
                .createdAt(variant.getCreatedAt())
                .updatedAt(variant.getUpdatedAt())
                .build();
    }

    private List<Map<String, String>> cartesianProduct(Map<String, List<String>> attributes) {
        List<Map<String, String>> result = new ArrayList<>();
        List<String> keys = new ArrayList<>(attributes.keySet());

        if (keys.isEmpty()) return result;

        cartesianHelper(attributes, keys, 0, new LinkedHashMap<>(), result);
        return result;
    }

    private void cartesianHelper(Map<String, List<String>> attributes, List<String> keys,
                                 int depth, Map<String, String> current, List<Map<String, String>> result) {
        if (depth == keys.size()) {
            result.add(new LinkedHashMap<>(current));
            return;
        }

        String key = keys.get(depth);
        for (String value : attributes.get(key)) {
            current.put(key, value);
            cartesianHelper(attributes, keys, depth + 1, current, result);
            current.remove(key);
        }
    }
}
