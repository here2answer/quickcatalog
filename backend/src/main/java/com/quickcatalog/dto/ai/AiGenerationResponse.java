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
public class AiGenerationResponse {
    private String generatedText;
    private String model;
    private Integer tokensUsed;
    private UUID logId;
}
