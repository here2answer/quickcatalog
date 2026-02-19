package com.quickcatalog.controller;

import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.image.ImageReorderRequest;
import com.quickcatalog.dto.image.ImageUploadResponse;
import com.quickcatalog.service.BackgroundRemovalService;
import com.quickcatalog.service.ProductImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products/{productId}/images")
@RequiredArgsConstructor
public class ProductImageController {

    private final ProductImageService productImageService;
    private final BackgroundRemovalService backgroundRemovalService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<List<ImageUploadResponse>> uploadImages(
            @PathVariable UUID productId,
            @RequestParam("files") List<MultipartFile> files) {
        List<ImageUploadResponse> response = productImageService.uploadImages(productId, files);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<Void> deleteImage(@PathVariable UUID productId,
                                         @PathVariable UUID imageId) {
        productImageService.deleteImage(productId, imageId);
        return ApiResponse.success(null);
    }

    @PutMapping("/reorder")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<Void> reorderImages(@PathVariable UUID productId,
                                           @Valid @RequestBody ImageReorderRequest request) {
        productImageService.reorderImages(productId, request);
        return ApiResponse.success(null);
    }

    @PostMapping("/{imageId}/remove-bg")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<String> removeBackground(@PathVariable UUID productId,
                                                @PathVariable UUID imageId) {
        String bgRemovedUrl = backgroundRemovalService.removeBackground(productId, imageId);
        return ApiResponse.success(bgRemovedUrl);
    }
}
