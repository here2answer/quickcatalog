package com.quickcatalog.dto.lookup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HsnSearchResponse {
    private String code;
    private String description;
    private String gstRate;
    private String chapter;
}
