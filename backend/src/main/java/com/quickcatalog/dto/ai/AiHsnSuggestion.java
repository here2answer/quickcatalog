package com.quickcatalog.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiHsnSuggestion {
    private String code;
    private String description;
    private String gstRate;
}
