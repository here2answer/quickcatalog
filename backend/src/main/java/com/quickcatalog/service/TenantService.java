package com.quickcatalog.service;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.settings.CompanySettingsRequest;
import com.quickcatalog.dto.settings.CompanySettingsResponse;
import com.quickcatalog.entity.Tenant;
import com.quickcatalog.entity.User;
import com.quickcatalog.entity.enums.AiProvider;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.repository.TenantRepository;
import com.quickcatalog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    public CompanySettingsResponse getSettings() {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return buildResponse(tenant, user);
    }

    @Transactional
    public CompanySettingsResponse updateSettings(CompanySettingsRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));

        tenant.setCompanyName(request.getCompanyName());
        tenant.setGstin(request.getGstin());
        tenant.setPhone(request.getPhone());

        if (request.getAiProvider() != null) {
            try {
                tenant.setAiProvider(AiProvider.valueOf(request.getAiProvider()));
            } catch (IllegalArgumentException ignored) {
                // keep existing
            }
        }
        if (request.getOpenaiApiKey() != null) {
            tenant.setOpenaiApiKey(request.getOpenaiApiKey());
        }

        tenant = tenantRepository.save(tenant);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return buildResponse(tenant, user);
    }

    private CompanySettingsResponse buildResponse(Tenant tenant, User user) {
        return CompanySettingsResponse.builder()
                .tenantId(tenant.getId())
                .companyName(tenant.getCompanyName())
                .gstin(tenant.getGstin())
                .phone(tenant.getPhone())
                .email(user.getEmail())
                .logoUrl(tenant.getLogoUrl())
                .subscriptionPlan(tenant.getSubscriptionPlan().name())
                .aiProvider(tenant.getAiProvider() != null ? tenant.getAiProvider().name() : "OLLAMA")
                .openaiApiKey(tenant.getOpenaiApiKey())
                .build();
    }
}
