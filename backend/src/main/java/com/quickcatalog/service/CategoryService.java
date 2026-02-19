package com.quickcatalog.service;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.category.CategoryRequest;
import com.quickcatalog.dto.category.CategoryResponse;
import com.quickcatalog.dto.category.CategoryTreeResponse;
import com.quickcatalog.entity.Category;
import com.quickcatalog.entity.enums.ActionType;
import com.quickcatalog.entity.enums.EntityType;
import com.quickcatalog.entity.enums.GstRate;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public List<CategoryTreeResponse> getCategoryTree() {
        UUID tenantId = TenantContext.getTenantId();
        List<Category> rootCategories = categoryRepository
                .findByTenantIdAndParentIsNullAndIsActiveTrueOrderBySortOrder(tenantId);
        return rootCategories.stream()
                .map(this::mapToTreeResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return mapToResponse(category);
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Category category = new Category();
        category.setTenantId(tenantId);
        category.setName(req.getName());
        category.setHsnCodeDefault(req.getHsnCodeDefault());
        category.setAttributesSchema(req.getAttributesSchema());
        category.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        category.setActive(true);

        if (req.getDefaultGstRate() != null) {
            category.setDefaultGstRate(GstRate.valueOf(req.getDefaultGstRate()));
        }

        if (req.getParentId() != null) {
            Category parent = categoryRepository.findByIdAndTenantId(req.getParentId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", req.getParentId()));
            category.setParent(parent);
        }

        category = categoryRepository.save(category);

        activityLogService.log(tenantId, userId, EntityType.CATEGORY, category.getId(),
                ActionType.CREATED, "{\"name\":\"" + category.getName() + "\"}");

        return mapToResponse(category);
    }

    @Transactional
    public CategoryResponse update(UUID id, CategoryRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        category.setName(req.getName());
        category.setHsnCodeDefault(req.getHsnCodeDefault());
        category.setAttributesSchema(req.getAttributesSchema());

        if (req.getSortOrder() != null) {
            category.setSortOrder(req.getSortOrder());
        }

        if (req.getDefaultGstRate() != null) {
            category.setDefaultGstRate(GstRate.valueOf(req.getDefaultGstRate()));
        }

        if (req.getParentId() != null) {
            Category parent = categoryRepository.findByIdAndTenantId(req.getParentId(), tenantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", req.getParentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        category = categoryRepository.save(category);

        activityLogService.log(tenantId, userId, EntityType.CATEGORY, category.getId(),
                ActionType.UPDATED, "{\"name\":\"" + category.getName() + "\"}");

        return mapToResponse(category);
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Category category = categoryRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        String categoryName = category.getName();
        categoryRepository.delete(category);

        activityLogService.log(tenantId, userId, EntityType.CATEGORY, id,
                ActionType.DELETED, "{\"name\":\"" + categoryName + "\"}");
    }

    @Transactional(readOnly = true)
    public String getAttributesSchema(UUID categoryId) {
        UUID tenantId = TenantContext.getTenantId();
        Category category = categoryRepository.findByIdAndTenantId(categoryId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        return category.getAttributesSchema();
    }

    private CategoryTreeResponse mapToTreeResponse(Category category) {
        List<CategoryTreeResponse> childResponses = List.of();
        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            childResponses = category.getChildren().stream()
                    .filter(Category::isActive)
                    .map(this::mapToTreeResponse)
                    .collect(Collectors.toList());
        }

        return CategoryTreeResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .hsnCodeDefault(category.getHsnCodeDefault())
                .defaultGstRate(category.getDefaultGstRate() != null ? category.getDefaultGstRate().name() : null)
                .attributesSchema(category.getAttributesSchema())
                .sortOrder(category.getSortOrder())
                .active(category.isActive())
                .children(childResponses)
                .build();
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .hsnCodeDefault(category.getHsnCodeDefault())
                .defaultGstRate(category.getDefaultGstRate() != null ? category.getDefaultGstRate().name() : null)
                .attributesSchema(category.getAttributesSchema())
                .sortOrder(category.getSortOrder())
                .active(category.isActive())
                .build();
    }
}
