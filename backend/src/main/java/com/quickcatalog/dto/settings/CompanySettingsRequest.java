package com.quickcatalog.dto.settings;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CompanySettingsRequest {
    @NotBlank(message = "Company name is required")
    private String companyName;
    private String gstin;
    private String phone;
    private String aiProvider;
    private String openaiApiKey;
}
