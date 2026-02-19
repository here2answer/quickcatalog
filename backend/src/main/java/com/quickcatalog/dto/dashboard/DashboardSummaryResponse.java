package com.quickcatalog.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private long totalProducts;
    private long activeProducts;
    private long draftProducts;
    private long inactiveProducts;
    private long lowStockProducts;
}
