package com.quickcatalog.service;

import com.quickcatalog.config.MinioConfig;
import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.image.ImageReorderRequest;
import com.quickcatalog.dto.image.ImageUploadResponse;
import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.ProductImage;
import com.quickcatalog.exception.FileValidationException;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.repository.ProductImageRepository;
import com.quickcatalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductImageService {

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;
    private final StorageService storageService;
    private final MinioConfig minioConfig;

    @Value("${app.image.thumbnail-size:150}")
    private int thumbnailSize;

    @Value("${app.image.medium-size:600}")
    private int mediumSize;

    @Value("${app.image.large-size:1200}")
    private int largeSize;

    @Value("${app.image.allowed-types:image/jpeg,image/png,image/webp}")
    private String allowedTypes;

    @Value("${app.image.max-size-mb:5}")
    private int maxSizeMb;

    @Transactional
    public List<ImageUploadResponse> uploadImages(UUID productId, List<MultipartFile> files) {
        UUID tenantId = TenantContext.getTenantId();

        Product product = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        long existingCount = productImageRepository.countByProductId(productId);
        List<ImageUploadResponse> responses = new ArrayList<>();

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            validateFile(file);

            try {
                String fileId = UUID.randomUUID().toString();
                String extension = getFileExtension(file.getOriginalFilename());
                String basePath = tenantId + "/products/" + productId + "/" + fileId;

                // Upload original
                String originalObjectName = basePath + "_original." + extension;
                String originalUrl = storageService.uploadFile(
                        originalObjectName, file.getInputStream(), file.getSize(), file.getContentType()
                );

                // Generate and upload thumbnail
                String thumbnailUrl = resizeAndUpload(file.getInputStream(), basePath + "_thumbnail.jpg", thumbnailSize);

                // Generate and upload medium
                String mediumUrl = resizeAndUpload(file.getInputStream(), basePath + "_medium.jpg", mediumSize);

                // Generate and upload large
                String largeUrl = resizeAndUpload(file.getInputStream(), basePath + "_large.jpg", largeSize);

                // Create entity
                ProductImage image = new ProductImage();
                image.setProduct(product);
                image.setOriginalUrl(originalUrl);
                image.setThumbnailUrl(thumbnailUrl);
                image.setMediumUrl(mediumUrl);
                image.setLargeUrl(largeUrl);
                image.setAltText(product.getName());
                image.setSortOrder((int) (existingCount + i));
                image.setPrimary(existingCount == 0 && i == 0);

                image = productImageRepository.save(image);
                responses.add(mapToResponse(image));

            } catch (Exception e) {
                log.error("Failed to process image: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to process image: " + e.getMessage(), e);
            }
        }

        return responses;
    }

    @Transactional
    public void deleteImage(UUID productId, UUID imageId) {
        UUID tenantId = TenantContext.getTenantId();

        productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        ProductImage image = productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductImage", "id", imageId));

        // Delete all files from MinIO
        deleteFileIfPresent(image.getOriginalUrl());
        deleteFileIfPresent(image.getThumbnailUrl());
        deleteFileIfPresent(image.getMediumUrl());
        deleteFileIfPresent(image.getLargeUrl());

        productImageRepository.delete(image);
    }

    @Transactional
    public void reorderImages(UUID productId, ImageReorderRequest req) {
        UUID tenantId = TenantContext.getTenantId();

        productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        List<UUID> imageIds = req.getImageIds();
        for (int i = 0; i < imageIds.size(); i++) {
            final UUID imageId = imageIds.get(i);
            final int sortOrder = i;
            ProductImage image = productImageRepository.findByIdAndProductId(imageId, productId)
                    .orElseThrow(() -> new ResourceNotFoundException("ProductImage", "id", imageId));
            image.setSortOrder(sortOrder);
            productImageRepository.save(image);
        }
    }

    private ImageUploadResponse mapToResponse(ProductImage image) {
        return ImageUploadResponse.builder()
                .id(image.getId())
                .originalUrl(image.getOriginalUrl())
                .thumbnailUrl(image.getThumbnailUrl())
                .mediumUrl(image.getMediumUrl())
                .largeUrl(image.getLargeUrl())
                .altText(image.getAltText())
                .primary(image.isPrimary())
                .sortOrder(image.getSortOrder())
                .build();
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileValidationException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new FileValidationException("File type not allowed: " + contentType
                    + ". Allowed types: " + allowedTypes);
        }

        long maxSizeBytes = (long) maxSizeMb * 1024 * 1024;
        if (file.getSize() > maxSizeBytes) {
            throw new FileValidationException("File size exceeds maximum allowed size of " + maxSizeMb + "MB");
        }
    }

    private String resizeAndUpload(InputStream inputStream, String objectName, int targetSize) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Thumbnails.of(inputStream)
                .size(targetSize, targetSize)
                .keepAspectRatio(true)
                .outputFormat("jpg")
                .outputQuality(0.85)
                .toOutputStream(baos);

        byte[] resizedBytes = baos.toByteArray();
        ByteArrayInputStream bais = new ByteArrayInputStream(resizedBytes);
        return storageService.uploadFile(objectName, bais, resizedBytes.length, "image/jpeg");
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "jpg";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private void deleteFileIfPresent(String url) {
        if (url != null) {
            try {
                String objectName = storageService.extractObjectName(url);
                storageService.deleteFile(objectName);
            } catch (Exception e) {
                log.warn("Failed to delete file from storage: {}", url, e);
            }
        }
    }
}
