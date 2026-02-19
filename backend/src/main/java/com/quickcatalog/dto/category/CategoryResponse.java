package com.quickcatalog.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private UUID id;
    private String name;
    private UUID parentId;
    private String hsnCodeDefault;
    private String defaultGstRate;
    private String attributesSchema;
    private int sortOrder;
    private boolean active;
}
