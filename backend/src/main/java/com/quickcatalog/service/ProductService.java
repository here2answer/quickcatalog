package com.quickcatalog.service;

import com.quickcatalog.channel.dto.ListingSummaryResponse;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.repository.ChannelRepository;
import com.quickcatalog.channel.repository.ProductChannelListingRepository;
import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.common.PagedResponse;
import com.quickcatalog.dto.image.ImageUploadResponse;
import com.quickcatalog.dto.product.*;
import com.quickcatalog.dto.variant.VariantResponse;
import com.quickcatalog.entity.Category;
import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.ProductImage;
import com.quickcatalog.entity.ProductVariant;
import com.quickcatalog.entity.enums.*;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.repository.CategoryRepository;
import com.quickcatalog.repository.ProductImageRepository;
import com.quickcatalog.repository.ProductRepository;
import com.quickcatalog.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductChannelListingRepository channelListingRepository;
    private final ChannelRepository channelRepository;
    private final ActivityLogService activityLogService;

    public PagedResponse<ProductListResponse> list(UUID categoryId, String status, String sort, int page, int size) {
        UUID tenantId = TenantContext.getTenantId();
        Pageable pageable = buildPageable(sort, page, size);

        Page<Product> productPage;

        if (categoryId != null && status != null) {
            ProductStatus productStatus = ProductStatus.valueOf(status);
            productPage = productRepository.findByTenantIdAndCategoryIdAndStatus(tenantId, categoryId, productStatus, pageable);
        } else if (categoryId != null) {
            productPage = productRepository.findByTenantIdAndCategoryIdAndStatusNot(tenantId, categoryId, ProductStatus.ARCHIVED, pageable);
        } else if (status != null) {
            ProductStatus productStatus = ProductStatus.valueOf(status);
            productPage = productRepository.findByTenantIdAndStatus(tenantId, productStatus, pageable);
        } else {
            productPage = productRepository.findByTenantIdAndStatusNot(tenantId, ProductStatus.ARCHIVED, pageable);
        }

        List<ProductListResponse> content = productPage.getContent().stream()
                .map(this::mapToListResponse)
                .collect(Collectors.toList());

        return PagedResponse.of(content, page, size, productPage.getTotalElements(), productPage.getTotalPages());
    }

    public ProductResponse getById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return mapToFullResponse(product);
    }

    @Transactional
    public ProductResponse create(ProductCreateRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Product product = new Product();
        product.setTenantId(tenantId);
        product.setCreatedBy(userId);
        product.setName(req.getName());
        product.setCategoryId(req.getCategoryId());
        product.setBrand(req.getBrand());
        product.setManufacturer(req.getManufacturer());
        product.setShortDescription(req.getShortDescription());
        product.setLongDescription(req.getLongDescription());
        product.setHsnCode(req.getHsnCode());
        product.setSacCode(req.getSacCode());
        product.setMrp(req.getMrp());
        product.setSellingPrice(req.getSellingPrice());
        product.setCostPrice(req.getCostPrice());
        product.setWeightGrams(req.getWeightGrams());
        product.setLengthCm(req.getLengthCm());
        product.setWidthCm(req.getWidthCm());
        product.setHeightCm(req.getHeightCm());
        product.setCustomAttributes(req.getCustomAttributes());
        product.setTags(req.getTags());
        product.setSeoTitle(req.getSeoTitle());
        product.setSeoDescription(req.getSeoDescription());
        product.setSeoKeywords(req.getSeoKeywords());
        product.setLowStockThreshold(req.getLowStockThreshold());

        if (req.getBarcodeType() != null) {
            product.setBarcodeType(BarcodeType.valueOf(req.getBarcodeType()));
        }
        product.setBarcodeValue(req.getBarcodeValue());

        if (req.getGstRate() != null) {
            product.setGstRate(GstRate.valueOf(req.getGstRate()));
        }

        if (req.getUnit() != null) {
            product.setUnit(UnitType.valueOf(req.getUnit()));
        }

        if (req.getTrackInventory() != null) {
            product.setTrackInventory(req.getTrackInventory());
        }

        if (req.getCurrentStock() != null) {
            product.setCurrentStock(req.getCurrentStock());
        }

        if (req.getIsFeatured() != null) {
            product.setFeatured(req.getIsFeatured());
        }

        // Generate slug
        String slug = generateSlug(req.getName());
        while (productRepository.existsByTenantIdAndSlug(tenantId, slug)) {
            slug = generateSlug(req.getName()) + "-" + randomAlphanumeric(4);
        }
        product.setSlug(slug);

        // Handle SKU
        if (req.getSku() != null && !req.getSku().isBlank()) {
            product.setSku(req.getSku());
        } else {
            String categoryName = "";
            if (req.getCategoryId() != null) {
                categoryName = categoryRepository.findByIdAndTenantId(req.getCategoryId(), tenantId)
                        .map(Category::getName)
                        .orElse("");
            }
            product.setSku(generateSku(categoryName));
        }

        // Set status
        if (req.getStatus() != null) {
            product.setStatus(ProductStatus.valueOf(req.getStatus()));
        } else {
            product.setStatus(ProductStatus.DRAFT);
        }

        product = productRepository.save(product);

        activityLogService.log(tenantId, userId, EntityType.PRODUCT, product.getId(),
                ActionType.CREATED, "{\"name\":\"" + product.getName() + "\"}");

        return mapToFullResponse(product);
    }

    @Transactional
    public ProductResponse update(UUID id, ProductUpdateRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        boolean nameChanged = false;

        if (req.getName() != null) {
            nameChanged = !req.getName().equals(product.getName());
            product.setName(req.getName());
        }
        if (req.getCategoryId() != null) {
            product.setCategoryId(req.getCategoryId());
        }
        if (req.getBrand() != null) {
            product.setBrand(req.getBrand());
        }
        if (req.getManufacturer() != null) {
            product.setManufacturer(req.getManufacturer());
        }
        if (req.getSku() != null) {
            product.setSku(req.getSku());
        }
        if (req.getShortDescription() != null) {
            product.setShortDescription(req.getShortDescription());
        }
        if (req.getLongDescription() != null) {
            product.setLongDescription(req.getLongDescription());
        }
        if (req.getHsnCode() != null) {
            product.setHsnCode(req.getHsnCode());
        }
        if (req.getSacCode() != null) {
            product.setSacCode(req.getSacCode());
        }
        if (req.getGstRate() != null) {
            product.setGstRate(GstRate.valueOf(req.getGstRate()));
        }
        if (req.getBarcodeType() != null) {
            product.setBarcodeType(BarcodeType.valueOf(req.getBarcodeType()));
        }
        if (req.getBarcodeValue() != null) {
            product.setBarcodeValue(req.getBarcodeValue());
        }
        if (req.getMrp() != null) {
            product.setMrp(req.getMrp());
        }
        if (req.getSellingPrice() != null) {
            product.setSellingPrice(req.getSellingPrice());
        }
        if (req.getCostPrice() != null) {
            product.setCostPrice(req.getCostPrice());
        }
        if (req.getUnit() != null) {
            product.setUnit(UnitType.valueOf(req.getUnit()));
        }
        if (req.getWeightGrams() != null) {
            product.setWeightGrams(req.getWeightGrams());
        }
        if (req.getLengthCm() != null) {
            product.setLengthCm(req.getLengthCm());
        }
        if (req.getWidthCm() != null) {
            product.setWidthCm(req.getWidthCm());
        }
        if (req.getHeightCm() != null) {
            product.setHeightCm(req.getHeightCm());
        }
        if (req.getTrackInventory() != null) {
            product.setTrackInventory(req.getTrackInventory());
        }
        if (req.getCurrentStock() != null) {
            product.setCurrentStock(req.getCurrentStock());
        }
        if (req.getLowStockThreshold() != null) {
            product.setLowStockThreshold(req.getLowStockThreshold());
        }
        if (req.getCustomAttributes() != null) {
            product.setCustomAttributes(req.getCustomAttributes());
        }
        if (req.getTags() != null) {
            product.setTags(req.getTags());
        }
        if (req.getSeoTitle() != null) {
            product.setSeoTitle(req.getSeoTitle());
        }
        if (req.getSeoDescription() != null) {
            product.setSeoDescription(req.getSeoDescription());
        }
        if (req.getSeoKeywords() != null) {
            product.setSeoKeywords(req.getSeoKeywords());
        }
        if (req.getIsFeatured() != null) {
            product.setFeatured(req.getIsFeatured());
        }

        // Regenerate slug if name changed
        if (nameChanged) {
            String slug = generateSlug(product.getName());
            while (productRepository.existsByTenantIdAndSlug(tenantId, slug)) {
                slug = generateSlug(product.getName()) + "-" + randomAlphanumeric(4);
            }
            product.setSlug(slug);
        }

        product = productRepository.save(product);

        activityLogService.log(tenantId, userId, EntityType.PRODUCT, product.getId(),
                ActionType.UPDATED, "{\"name\":\"" + product.getName() + "\"}");

        return mapToFullResponse(product);
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        product.setStatus(ProductStatus.ARCHIVED);
        productRepository.save(product);

        activityLogService.log(tenantId, userId, EntityType.PRODUCT, product.getId(),
                ActionType.DELETED, "{\"name\":\"" + product.getName() + "\"}");
    }

    @Transactional
    public void changeStatus(UUID id, ProductStatusRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        ProductStatus newStatus = ProductStatus.valueOf(req.getStatus());
        product.setStatus(newStatus);
        productRepository.save(product);

        activityLogService.log(tenantId, userId, EntityType.PRODUCT, product.getId(),
                ActionType.STATUS_CHANGED,
                "{\"name\":\"" + product.getName() + "\",\"status\":\"" + newStatus.name() + "\"}");
    }

    @Transactional
    public ProductResponse duplicate(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Product original = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        Product copy = new Product();
        copy.setTenantId(tenantId);
        copy.setCreatedBy(userId);
        copy.setName(original.getName() + " (Copy)");
        copy.setCategoryId(original.getCategoryId());
        copy.setBrand(original.getBrand());
        copy.setManufacturer(original.getManufacturer());
        copy.setShortDescription(original.getShortDescription());
        copy.setLongDescription(original.getLongDescription());
        copy.setHsnCode(original.getHsnCode());
        copy.setSacCode(original.getSacCode());
        copy.setGstRate(original.getGstRate());
        copy.setBarcodeType(original.getBarcodeType());
        copy.setBarcodeValue(null);
        copy.setMrp(original.getMrp());
        copy.setSellingPrice(original.getSellingPrice());
        copy.setCostPrice(original.getCostPrice());
        copy.setUnit(original.getUnit());
        copy.setWeightGrams(original.getWeightGrams());
        copy.setLengthCm(original.getLengthCm());
        copy.setWidthCm(original.getWidthCm());
        copy.setHeightCm(original.getHeightCm());
        copy.setTrackInventory(original.isTrackInventory());
        copy.setCurrentStock(original.getCurrentStock());
        copy.setLowStockThreshold(original.getLowStockThreshold());
        copy.setCustomAttributes(original.getCustomAttributes());
        copy.setTags(original.getTags());
        copy.setSeoTitle(original.getSeoTitle());
        copy.setSeoDescription(original.getSeoDescription());
        copy.setSeoKeywords(original.getSeoKeywords());
        copy.setFeatured(original.isFeatured());
        copy.setStatus(ProductStatus.DRAFT);

        // Generate new slug
        String slug = generateSlug(copy.getName());
        while (productRepository.existsByTenantIdAndSlug(tenantId, slug)) {
            slug = generateSlug(copy.getName()) + "-" + randomAlphanumeric(4);
        }
        copy.setSlug(slug);

        // Generate new SKU
        String categoryName = "";
        if (original.getCategoryId() != null) {
            categoryName = categoryRepository.findByIdAndTenantId(original.getCategoryId(), tenantId)
                    .map(Category::getName)
                    .orElse("");
        }
        copy.setSku(generateSku(categoryName));

        copy = productRepository.save(copy);

        activityLogService.log(tenantId, userId, EntityType.PRODUCT, copy.getId(),
                ActionType.CREATED,
                "{\"name\":\"" + copy.getName() + "\",\"duplicatedFrom\":\"" + original.getId() + "\"}");

        return mapToFullResponse(copy);
    }

    public PagedResponse<ProductListResponse> search(String query, int page, int size) {
        UUID tenantId = TenantContext.getTenantId();
        Pageable pageable = PageRequest.of(page, size);

        Page<Product> productPage = productRepository.fullTextSearch(tenantId, query, pageable);

        if (productPage.isEmpty()) {
            productPage = productRepository.fuzzySearch(tenantId, query, pageable);
        }

        List<ProductListResponse> content = productPage.getContent().stream()
                .map(this::mapToListResponse)
                .collect(Collectors.toList());

        return PagedResponse.of(content, page, size, productPage.getTotalElements(), productPage.getTotalPages());
    }

    public ProductListResponse findByBarcode(String barcode) {
        UUID tenantId = TenantContext.getTenantId();
        Product product = productRepository.findByTenantIdAndBarcodeValue(tenantId, barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "barcode", barcode));
        return mapToListResponse(product);
    }

    public List<ProductListResponse> getLowStock() {
        UUID tenantId = TenantContext.getTenantId();
        return productRepository.findLowStock(tenantId).stream()
                .map(this::mapToListResponse)
                .collect(Collectors.toList());
    }

    public byte[] exportCsv() {
        UUID tenantId = TenantContext.getTenantId();
        List<Product> products = productRepository
                .findByTenantIdAndStatusNot(tenantId, ProductStatus.ARCHIVED, Pageable.unpaged())
                .getContent();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8);

        // CSV header
        writer.println("Name,SKU,Category,Brand,MRP,Selling Price,GST Rate,HSN Code,Stock,Status");

        for (Product product : products) {
            String categoryName = "";
            if (product.getCategoryId() != null) {
                categoryName = categoryRepository.findById(product.getCategoryId())
                        .map(Category::getName)
                        .orElse("");
            }

            writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",%s,%s,\"%s\",\"%s\",%s,\"%s\"%n",
                    escapeCsv(product.getName()),
                    escapeCsv(product.getSku()),
                    escapeCsv(categoryName),
                    escapeCsv(product.getBrand()),
                    product.getMrp() != null ? product.getMrp().toPlainString() : "",
                    product.getSellingPrice() != null ? product.getSellingPrice().toPlainString() : "",
                    product.getGstRate() != null ? product.getGstRate().name() : "",
                    escapeCsv(product.getHsnCode()),
                    product.getCurrentStock() != null ? product.getCurrentStock().toPlainString() : "0",
                    product.getStatus() != null ? product.getStatus().name() : ""
            );
        }

        writer.flush();
        return baos.toByteArray();
    }

    // --- Private helpers ---

    private ProductResponse mapToFullResponse(Product product) {
        String categoryName = null;
        if (product.getCategoryId() != null) {
            categoryName = categoryRepository.findById(product.getCategoryId())
                    .map(Category::getName)
                    .orElse(null);
        }

        List<ImageUploadResponse> imageResponses = Collections.emptyList();
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrder(product.getId());
        if (images != null && !images.isEmpty()) {
            imageResponses = images.stream()
                    .map(img -> ImageUploadResponse.builder()
                            .id(img.getId())
                            .originalUrl(img.getOriginalUrl())
                            .thumbnailUrl(img.getThumbnailUrl())
                            .mediumUrl(img.getMediumUrl())
                            .largeUrl(img.getLargeUrl())
                            .altText(img.getAltText())
                            .primary(img.isPrimary())
                            .sortOrder(img.getSortOrder())
                            .build())
                    .collect(Collectors.toList());
        }

        List<VariantResponse> variantResponses = Collections.emptyList();
        List<ProductVariant> variants = productVariantRepository.findByProductIdOrderByCreatedAtAsc(product.getId());
        if (variants != null && !variants.isEmpty()) {
            variantResponses = variants.stream()
                    .map(v -> VariantResponse.builder()
                            .id(v.getId())
                            .productId(v.getProductId())
                            .variantName(v.getVariantName())
                            .sku(v.getSku())
                            .barcodeValue(v.getBarcodeValue())
                            .attributes(v.getAttributes())
                            .mrp(v.getMrp())
                            .sellingPrice(v.getSellingPrice())
                            .costPrice(v.getCostPrice())
                            .currentStock(v.getCurrentStock())
                            .weightGrams(v.getWeightGrams())
                            .imageId(v.getImageId())
                            .active(v.isActive())
                            .createdAt(v.getCreatedAt())
                            .updatedAt(v.getUpdatedAt())
                            .build())
                    .collect(Collectors.toList());
        }

        List<ListingSummaryResponse> listingSummaries = Collections.emptyList();
        List<ProductChannelListing> listings = channelListingRepository
                .findByProductIdAndTenantId(product.getId(), product.getTenantId());
        if (listings != null && !listings.isEmpty()) {
            listingSummaries = listings.stream()
                    .map(listing -> {
                        Channel ch = channelRepository.findById(listing.getChannelId()).orElse(null);
                        return ListingSummaryResponse.builder()
                                .channelId(listing.getChannelId())
                                .channelName(ch != null ? ch.getChannelName() : null)
                                .channelType(ch != null ? ch.getChannelType() : null)
                                .listingStatus(listing.getListingStatus())
                                .channelPrice(listing.getChannelPrice())
                                .build();
                    })
                    .collect(Collectors.toList());
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .categoryId(product.getCategoryId())
                .categoryName(categoryName)
                .brand(product.getBrand())
                .manufacturer(product.getManufacturer())
                .sku(product.getSku())
                .shortDescription(product.getShortDescription())
                .longDescription(product.getLongDescription())
                .hsnCode(product.getHsnCode())
                .sacCode(product.getSacCode())
                .gstRate(product.getGstRate() != null ? product.getGstRate().name() : null)
                .barcodeType(product.getBarcodeType() != null ? product.getBarcodeType().name() : null)
                .barcodeValue(product.getBarcodeValue())
                .mrp(product.getMrp())
                .sellingPrice(product.getSellingPrice())
                .costPrice(product.getCostPrice())
                .unit(product.getUnit() != null ? product.getUnit().name() : null)
                .weightGrams(product.getWeightGrams())
                .lengthCm(product.getLengthCm())
                .widthCm(product.getWidthCm())
                .heightCm(product.getHeightCm())
                .trackInventory(product.isTrackInventory())
                .currentStock(product.getCurrentStock())
                .lowStockThreshold(product.getLowStockThreshold())
                .customAttributes(product.getCustomAttributes())
                .tags(product.getTags())
                .seoTitle(product.getSeoTitle())
                .seoDescription(product.getSeoDescription())
                .seoKeywords(product.getSeoKeywords())
                .status(product.getStatus() != null ? product.getStatus().name() : null)
                .featured(product.isFeatured())
                .images(imageResponses)
                .variants(variantResponses)
                .channelListings(listingSummaries)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private ProductListResponse mapToListResponse(Product product) {
        String categoryName = null;
        if (product.getCategoryId() != null) {
            categoryName = categoryRepository.findById(product.getCategoryId())
                    .map(Category::getName)
                    .orElse(null);
        }

        String thumbnailUrl = null;
        ProductImage primaryImage = productImageRepository
                .findFirstByProductIdAndIsPrimaryTrue(product.getId())
                .orElse(null);
        if (primaryImage != null) {
            thumbnailUrl = primaryImage.getThumbnailUrl();
        }

        return ProductListResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .thumbnailUrl(thumbnailUrl)
                .categoryName(categoryName)
                .mrp(product.getMrp())
                .sellingPrice(product.getSellingPrice())
                .gstRate(product.getGstRate() != null ? product.getGstRate().name() : null)
                .status(product.getStatus() != null ? product.getStatus().name() : null)
                .currentStock(product.getCurrentStock())
                .lowStockThreshold(product.getLowStockThreshold())
                .trackInventory(product.isTrackInventory())
                .tags(product.getTags())
                .createdAt(product.getCreatedAt())
                .build();
    }

    private String generateSlug(String name) {
        if (name == null) return "";
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private String generateSku(String categoryName) {
        String prefix = "PRD";
        if (categoryName != null && !categoryName.isBlank()) {
            prefix = categoryName.replaceAll("[^A-Za-z]", "")
                    .toUpperCase()
                    .substring(0, Math.min(3, categoryName.replaceAll("[^A-Za-z]", "").length()));
            if (prefix.isEmpty()) {
                prefix = "PRD";
            }
        }
        String suffix = randomAlphanumeric(6).toUpperCase();
        return prefix + "-" + suffix;
    }

    private Pageable buildPageable(String sort, int page, int size) {
        Sort sortSpec;
        if (sort == null) {
            sortSpec = Sort.by(Sort.Direction.DESC, "createdAt");
        } else {
            sortSpec = switch (sort) {
                case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
                case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
                case "name_desc" -> Sort.by(Sort.Direction.DESC, "name");
                case "price_asc" -> Sort.by(Sort.Direction.ASC, "sellingPrice");
                case "price_desc" -> Sort.by(Sort.Direction.DESC, "sellingPrice");
                default -> Sort.by(Sort.Direction.DESC, "createdAt"); // "newest" and default
            };
        }
        return PageRequest.of(page, size, sortSpec);
    }

    private String randomAlphanumeric(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(ThreadLocalRandom.current().nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}
