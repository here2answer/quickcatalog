package com.quickcatalog.controller;

import com.quickcatalog.dto.category.CategoryRequest;
import com.quickcatalog.dto.category.CategoryResponse;
import com.quickcatalog.dto.category.CategoryTreeResponse;
import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<CategoryTreeResponse>> getCategoryTree() {
        List<CategoryTreeResponse> tree = categoryService.getCategoryTree();
        return ApiResponse.success(tree);
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<CategoryResponse> getById(@PathVariable UUID id) {
        CategoryResponse response = categoryService.getById(id);
        return ApiResponse.success(response);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.create(request);
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<CategoryResponse> update(@PathVariable UUID id,
                                                @Valid @RequestBody CategoryRequest request) {
        CategoryResponse response = categoryService.update(id, request);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        categoryService.delete(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/{id}/attributes-schema")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<String> getAttributesSchema(@PathVariable UUID id) {
        String schema = categoryService.getAttributesSchema(id);
        return ApiResponse.success(schema);
    }
}
