package com.quickcatalog.dto.category;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTreeResponse {
    private UUID id;
    private String name;
    private UUID parentId;
    private String hsnCodeDefault;
    private String defaultGstRate;
    private String attributesSchema;
    private int sortOrder;
    private boolean active;

    @Builder.Default
    private List<CategoryTreeResponse> children = new ArrayList<>();
}
