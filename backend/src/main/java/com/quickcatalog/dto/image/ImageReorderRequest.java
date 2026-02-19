package com.quickcatalog.dto.image;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ImageReorderRequest {
    @NotEmpty(message = "Image IDs list cannot be empty")
    private List<UUID> imageIds;
}
