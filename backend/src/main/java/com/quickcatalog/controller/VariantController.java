package com.quickcatalog.controller;

import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.variant.VariantGenerateRequest;
import com.quickcatalog.dto.variant.VariantRequest;
import com.quickcatalog.dto.variant.VariantResponse;
import com.quickcatalog.service.VariantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products/{productId}/variants")
@RequiredArgsConstructor
public class VariantController {

    private final VariantService variantService;

    @GetMapping
    public ApiResponse<List<VariantResponse>> list(@PathVariable UUID productId) {
        return ApiResponse.success(variantService.list(productId));
    }

    @GetMapping("/{variantId}")
    public ApiResponse<VariantResponse> getById(@PathVariable UUID productId, @PathVariable UUID variantId) {
        return ApiResponse.success(variantService.getById(productId, variantId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<VariantResponse> create(@PathVariable UUID productId,
                                               @Valid @RequestBody VariantRequest request) {
        return ApiResponse.success(variantService.create(productId, request));
    }

    @PutMapping("/{variantId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<VariantResponse> update(@PathVariable UUID productId,
                                               @PathVariable UUID variantId,
                                               @Valid @RequestBody VariantRequest request) {
        return ApiResponse.success(variantService.update(productId, variantId, request));
    }

    @DeleteMapping("/{variantId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<Void> delete(@PathVariable UUID productId, @PathVariable UUID variantId) {
        variantService.delete(productId, variantId);
        return ApiResponse.success("Variant deleted", null);
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<List<VariantResponse>> generate(@PathVariable UUID productId,
                                                       @Valid @RequestBody VariantGenerateRequest request) {
        return ApiResponse.success(variantService.generateVariants(productId, request));
    }
}
