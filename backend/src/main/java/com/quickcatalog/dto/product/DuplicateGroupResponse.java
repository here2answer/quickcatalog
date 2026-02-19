package com.quickcatalog.dto.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateGroupResponse {
    private UUID productId;
    private String productName;
    private String productSku;
    private List<DuplicateMatchResponse> matches;
}
