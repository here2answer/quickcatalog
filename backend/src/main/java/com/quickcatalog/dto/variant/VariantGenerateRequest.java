package com.quickcatalog.dto.variant;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class VariantGenerateRequest {
    @NotEmpty(message = "At least one attribute with values is required")
    private Map<String, List<String>> attributeCombinations;
}
