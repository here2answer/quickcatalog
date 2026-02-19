package com.quickcatalog.dto.settings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanySettingsResponse {
    private UUID tenantId;
    private String companyName;
    private String gstin;
    private String phone;
    private String email;
    private String logoUrl;
    private String subscriptionPlan;
    private String aiProvider;
    private String openaiApiKey;
}
