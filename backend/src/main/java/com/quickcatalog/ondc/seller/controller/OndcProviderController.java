package com.quickcatalog.ondc.seller.controller;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.ondc.entity.OndcProvider;
import com.quickcatalog.ondc.repository.OndcProviderRepository;
import com.quickcatalog.ondc.seller.dto.ProviderRequest;
import com.quickcatalog.ondc.seller.dto.ProviderResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ondc/providers")
@RequiredArgsConstructor
public class OndcProviderController {

    private final OndcProviderRepository providerRepository;

    @GetMapping
    public ApiResponse<List<ProviderResponse>> list() {
        UUID tenantId = TenantContext.getTenantId();
        List<ProviderResponse> providers = providerRepository.findByTenantId(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ApiResponse.success(providers);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProviderResponse> getById(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        OndcProvider provider = providerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("OndcProvider", "id", id));
        return ApiResponse.success(mapToResponse(provider));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<ProviderResponse> create(@Valid @RequestBody ProviderRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        OndcProvider provider = new OndcProvider();
        provider.setTenantId(tenantId);
        provider.setProviderId("QC-" + tenantId.toString().substring(0, 8));
        applyRequest(provider, request);

        OndcProvider saved = providerRepository.save(provider);
        return ApiResponse.success(mapToResponse(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<ProviderResponse> update(@PathVariable UUID id,
                                                 @Valid @RequestBody ProviderRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        OndcProvider provider = providerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("OndcProvider", "id", id));

        applyRequest(provider, request);
        OndcProvider saved = providerRepository.save(provider);
        return ApiResponse.success(mapToResponse(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        OndcProvider provider = providerRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("OndcProvider", "id", id));
        providerRepository.delete(provider);
        return ApiResponse.success(null);
    }

    private void applyRequest(OndcProvider provider, ProviderRequest req) {
        provider.setName(req.getName());
        provider.setShortDesc(req.getShortDesc());
        provider.setLongDesc(req.getLongDesc());
        provider.setLogoUrl(req.getLogoUrl());
        provider.setGpsCoordinates(req.getGpsCoordinates());
        provider.setAddressStreet(req.getAddressStreet());
        provider.setAddressCity(req.getAddressCity());
        provider.setAddressState(req.getAddressState());
        provider.setAddressAreaCode(req.getAddressAreaCode());
        if (req.getAddressCountry() != null) provider.setAddressCountry(req.getAddressCountry());
        provider.setContactPhone(req.getContactPhone());
        provider.setContactEmail(req.getContactEmail());
        provider.setSupportPhone(req.getSupportPhone());
        provider.setSupportEmail(req.getSupportEmail());
        provider.setSupportUrl(req.getSupportUrl());
        provider.setFssaiLicenseNo(req.getFssaiLicenseNo());
        if (req.getStoreTimingStart() != null) {
            provider.setStoreTimingStart(LocalTime.parse(req.getStoreTimingStart()));
        }
        if (req.getStoreTimingEnd() != null) {
            provider.setStoreTimingEnd(LocalTime.parse(req.getStoreTimingEnd()));
        }
        if (req.getStoreDays() != null) provider.setStoreDays(req.getStoreDays());
        if (req.getDefaultTimeToShip() != null) provider.setDefaultTimeToShip(req.getDefaultTimeToShip());
        if (req.getDefaultReturnable() != null) provider.setDefaultReturnable(req.getDefaultReturnable());
        if (req.getDefaultCancellable() != null) provider.setDefaultCancellable(req.getDefaultCancellable());
        if (req.getDefaultReturnWindow() != null) provider.setDefaultReturnWindow(req.getDefaultReturnWindow());
        if (req.getDefaultCodAvailable() != null) provider.setDefaultCodAvailable(req.getDefaultCodAvailable());
    }

    private ProviderResponse mapToResponse(OndcProvider entity) {
        ProviderResponse dto = new ProviderResponse();
        dto.setId(entity.getId());
        dto.setProviderId(entity.getProviderId());
        dto.setName(entity.getName());
        dto.setShortDesc(entity.getShortDesc());
        dto.setLongDesc(entity.getLongDesc());
        dto.setLogoUrl(entity.getLogoUrl());
        dto.setGpsCoordinates(entity.getGpsCoordinates());
        dto.setAddressStreet(entity.getAddressStreet());
        dto.setAddressCity(entity.getAddressCity());
        dto.setAddressState(entity.getAddressState());
        dto.setAddressAreaCode(entity.getAddressAreaCode());
        dto.setAddressCountry(entity.getAddressCountry());
        dto.setContactPhone(entity.getContactPhone());
        dto.setContactEmail(entity.getContactEmail());
        dto.setSupportPhone(entity.getSupportPhone());
        dto.setSupportEmail(entity.getSupportEmail());
        dto.setSupportUrl(entity.getSupportUrl());
        dto.setFssaiLicenseNo(entity.getFssaiLicenseNo());
        dto.setStoreTimingStart(entity.getStoreTimingStart() != null ? entity.getStoreTimingStart().toString() : null);
        dto.setStoreTimingEnd(entity.getStoreTimingEnd() != null ? entity.getStoreTimingEnd().toString() : null);
        dto.setStoreDays(entity.getStoreDays());
        dto.setDefaultTimeToShip(entity.getDefaultTimeToShip());
        dto.setDefaultReturnable(entity.isDefaultReturnable());
        dto.setDefaultCancellable(entity.isDefaultCancellable());
        dto.setDefaultReturnWindow(entity.getDefaultReturnWindow());
        dto.setDefaultCodAvailable(entity.isDefaultCodAvailable());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
