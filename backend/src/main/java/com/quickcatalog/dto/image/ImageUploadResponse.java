package com.quickcatalog.dto.image;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadResponse {
    private UUID id;
    private String originalUrl;
    private String thumbnailUrl;
    private String mediumUrl;
    private String largeUrl;
    private String altText;
    private boolean primary;
    private int sortOrder;
}
