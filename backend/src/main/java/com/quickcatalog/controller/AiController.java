package com.quickcatalog.controller;

import com.quickcatalog.dto.ai.*;
import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/generate-description")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<AiGenerationResponse> generateDescription(
            @Valid @RequestBody AiGenerateDescriptionRequest request) {
        return ApiResponse.success(aiService.generateDescription(request));
    }

    @PostMapping("/generate-seo")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<AiSeoResponse> generateSeo(
            @Valid @RequestBody AiGenerateSeoRequest request) {
        return ApiResponse.success(aiService.generateSeo(request));
    }

    @PostMapping("/suggest-hsn")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<List<AiHsnSuggestion>> suggestHsn(
            @Valid @RequestBody AiSuggestHsnRequest request) {
        return ApiResponse.success(aiService.suggestHsn(request));
    }

    @PostMapping("/suggest-tags")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<AiGenerationResponse> suggestTags(
            @Valid @RequestBody AiSuggestTagsRequest request) {
        return ApiResponse.success(aiService.suggestTags(request));
    }

    @PostMapping("/accept")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<Void> acceptGeneration(@Valid @RequestBody AiAcceptRequest request) {
        aiService.acceptGeneration(request);
        return ApiResponse.success("Generation status updated", null);
    }
}
