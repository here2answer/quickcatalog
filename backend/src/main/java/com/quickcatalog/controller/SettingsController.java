package com.quickcatalog.controller;

import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.settings.CompanySettingsRequest;
import com.quickcatalog.dto.settings.CompanySettingsResponse;
import com.quickcatalog.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final TenantService tenantService;

    @GetMapping("/company")
    public ApiResponse<CompanySettingsResponse> getCompanySettings() {
        CompanySettingsResponse response = tenantService.getSettings();
        return ApiResponse.success(response);
    }

    @PutMapping("/company")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<CompanySettingsResponse> updateCompanySettings(
            @Valid @RequestBody CompanySettingsRequest request) {
        CompanySettingsResponse response = tenantService.updateSettings(request);
        return ApiResponse.success("Settings updated successfully", response);
    }
}
