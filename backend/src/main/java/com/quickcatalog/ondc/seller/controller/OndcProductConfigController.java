package com.quickcatalog.ondc.seller.controller;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.entity.Product;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.ondc.entity.OndcProductConfig;
import com.quickcatalog.ondc.repository.OndcProductConfigRepository;
import com.quickcatalog.ondc.seller.dto.ProductConfigRequest;
import com.quickcatalog.ondc.seller.dto.ProductConfigResponse;
import com.quickcatalog.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ondc/products")
@RequiredArgsConstructor
public class OndcProductConfigController {

    private final OndcProductConfigRepository configRepository;
    private final ProductRepository productRepository;

    @GetMapping("/{productId}/config")
    public ApiResponse<ProductConfigResponse> getConfig(@PathVariable UUID productId) {
        UUID tenantId = TenantContext.getTenantId();
        OndcProductConfig config = configRepository.findByProductIdAndTenantId(productId, tenantId)
                .orElse(null);
        return ApiResponse.success(config != null ? mapToResponse(config) : null);
    }

    @PutMapping("/{productId}/config")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ProductConfigResponse> setConfig(@PathVariable UUID productId,
                                                         @Valid @RequestBody ProductConfigRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        // Verify product exists and belongs to tenant
        productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        OndcProductConfig config = configRepository.findByProductIdAndTenantId(productId, tenantId)
                .orElse(new OndcProductConfig());

        config.setProductId(productId);
        config.setTenantId(tenantId);
        config.setOndcDomain(request.getOndcDomain());
        config.setOndcCategoryId(request.getOndcCategoryId());
        config.setTimeToShip(request.getTimeToShip());
        config.setReturnable(request.getReturnable());
        config.setCancellable(request.getCancellable());
        config.setReturnWindow(request.getReturnWindow());
        if (request.getSellerPickupReturn() != null) {
            config.setSellerPickupReturn(request.getSellerPickupReturn());
        }
        config.setCodAvailable(request.getCodAvailable());
        config.setMaxOrderQuantity(request.getMaxOrderQuantity());
        if (request.getCountryOfOrigin() != null) config.setCountryOfOrigin(request.getCountryOfOrigin());
        config.setIsVeg(request.getIsVeg());
        config.setIsNonVeg(request.getIsNonVeg());
        config.setIsEgg(request.getIsEgg());
        config.setStatutoryInfo(request.getStatutoryInfo());

        OndcProductConfig saved = configRepository.save(config);
        return ApiResponse.success(mapToResponse(saved));
    }

    @PostMapping("/{productId}/publish")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ProductConfigResponse> publish(@PathVariable UUID productId) {
        UUID tenantId = TenantContext.getTenantId();
        OndcProductConfig config = configRepository.findByProductIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new RuntimeException("ONDC config not set for this product. Set config first."));

        config.setPublishedToOndc(true);
        config.setLastPublishedAt(LocalDateTime.now());
        OndcProductConfig saved = configRepository.save(config);
        return ApiResponse.success(mapToResponse(saved));
    }

    @PostMapping("/{productId}/unpublish")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ProductConfigResponse> unpublish(@PathVariable UUID productId) {
        UUID tenantId = TenantContext.getTenantId();
        OndcProductConfig config = configRepository.findByProductIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("OndcProductConfig", "productId", productId));

        config.setPublishedToOndc(false);
        OndcProductConfig saved = configRepository.save(config);
        return ApiResponse.success(mapToResponse(saved));
    }

    @GetMapping("/published")
    public ApiResponse<List<ProductConfigResponse>> listPublished() {
        UUID tenantId = TenantContext.getTenantId();
        List<ProductConfigResponse> published = configRepository
                .findByTenantIdAndPublishedToOndcTrue(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ApiResponse.success(published);
    }

    private ProductConfigResponse mapToResponse(OndcProductConfig entity) {
        ProductConfigResponse dto = new ProductConfigResponse();
        dto.setId(entity.getId());
        dto.setProductId(entity.getProductId());
        dto.setOndcDomain(entity.getOndcDomain());
        dto.setOndcCategoryId(entity.getOndcCategoryId());
        dto.setTimeToShip(entity.getTimeToShip());
        dto.setReturnable(entity.getReturnable());
        dto.setCancellable(entity.getCancellable());
        dto.setReturnWindow(entity.getReturnWindow());
        dto.setSellerPickupReturn(entity.isSellerPickupReturn());
        dto.setCodAvailable(entity.getCodAvailable());
        dto.setMaxOrderQuantity(entity.getMaxOrderQuantity());
        dto.setCountryOfOrigin(entity.getCountryOfOrigin());
        dto.setIsVeg(entity.getIsVeg());
        dto.setIsNonVeg(entity.getIsNonVeg());
        dto.setIsEgg(entity.getIsEgg());
        dto.setStatutoryInfo(entity.getStatutoryInfo());
        dto.setPublishedToOndc(entity.isPublishedToOndc());
        dto.setLastPublishedAt(entity.getLastPublishedAt());
        return dto;
    }
}
