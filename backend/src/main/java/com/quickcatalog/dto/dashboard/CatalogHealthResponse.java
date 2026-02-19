package com.quickcatalog.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CatalogHealthResponse {
    private long totalProducts;
    private long productsWithImages;
    private long productsWithDescriptions;
    private long productsWithSeo;
    private long productsWithBarcode;
    private long productsWithHsn;
    private int completenessPercent;
    private Map<String, Long> statusDistribution;
    private Map<String, Long> categoryDistribution;
}
