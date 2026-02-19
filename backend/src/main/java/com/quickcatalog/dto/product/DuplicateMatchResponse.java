package com.quickcatalog.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateMatchResponse {
    private UUID id;
    private String name;
    private String sku;
    private String status;
    private String matchType;
    private double similarityScore;
}
