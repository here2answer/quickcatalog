package com.quickcatalog.service;

import com.quickcatalog.entity.ProductImage;
import com.quickcatalog.exception.BadRequestException;
import com.quickcatalog.repository.ProductImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BackgroundRemovalService {

    private final ProductImageRepository imageRepository;
    private final StorageService storageService;

    @Value("${app.bg-removal.api-url:}")
    private String bgRemovalApiUrl;

    public String removeBackground(UUID productId, UUID imageId) {
        ProductImage image = imageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new BadRequestException("Image not found"));

        if (bgRemovalApiUrl == null || bgRemovalApiUrl.isBlank()) {
            throw new BadRequestException(
                    "Background removal service not configured. Set app.bg-removal.api-url in application.yml");
        }

        // TODO: Implement actual background removal via external API (remove.bg or local rembg)
        // 1. Download original image from MinIO
        // 2. Send to BG removal API
        // 3. Upload result to MinIO
        // 4. Update image.bgRemovedUrl
        throw new BadRequestException("Background removal service integration pending");
    }
}
