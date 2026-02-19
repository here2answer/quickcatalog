package com.quickcatalog.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSeoResponse {
    private String seoTitle;
    private String seoDescription;
    private String[] seoKeywords;
    private String model;
    private UUID logId;
}
