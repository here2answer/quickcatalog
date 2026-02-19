package com.quickcatalog.dto.category;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CategoryRequest {
    @NotBlank(message = "Category name is required")
    private String name;

    private UUID parentId;
    private String hsnCodeDefault;
    private String defaultGstRate;
    private String attributesSchema; // JSON string
    private Integer sortOrder;
}
