package com.quickcatalog.dto.ai;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
public class AiGenerateDescriptionRequest {
    @NotBlank(message = "Product name is required")
    private String productName;
    private String categoryName;
    private String brand;
    private Map<String, String> attributes;
    private String existingDescription;
    private UUID productId;
}
