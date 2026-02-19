package com.quickcatalog.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class AiGenerateSeoRequest {
    @NotBlank(message = "Product name is required")
    private String productName;
    private String categoryName;
    private String description;
    private String[] tags;
    private UUID productId;
}
