package com.quickcatalog.service;

import com.quickcatalog.config.AiConfig;
import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.ai.*;
import com.quickcatalog.entity.AiGenerationLog;
import com.quickcatalog.entity.Tenant;
import com.quickcatalog.entity.enums.AiGenerationType;
import com.quickcatalog.entity.enums.AiProvider;
import com.quickcatalog.exception.BadRequestException;
import com.quickcatalog.repository.AiGenerationLogRepository;
import com.quickcatalog.repository.TenantRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final AiConfig aiConfig;
    private final TenantRepository tenantRepository;
    private final AiGenerationLogRepository logRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AiGenerationResponse generateDescription(AiGenerateDescriptionRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = getTenant(tenantId);

        StringBuilder prompt = new StringBuilder();
        prompt.append("Write a compelling product description for Indian e-commerce.\n");
        prompt.append("Product: ").append(req.getProductName()).append("\n");
        if (req.getCategoryName() != null) prompt.append("Category: ").append(req.getCategoryName()).append("\n");
        if (req.getBrand() != null) prompt.append("Brand: ").append(req.getBrand()).append("\n");
        if (req.getAttributes() != null && !req.getAttributes().isEmpty()) {
            prompt.append("Attributes: ").append(req.getAttributes()).append("\n");
        }
        prompt.append("\nWrite 150-200 words highlighting key features, benefits, and quality. ");
        prompt.append("Use a professional tone suitable for Indian e-commerce platforms. ");
        prompt.append("Return only the description text, no headings or formatting.");

        String result = callAi(tenant, prompt.toString());

        AiGenerationLog aiLog = saveLog(tenantId, req.getProductId(), AiGenerationType.DESCRIPTION,
                prompt.toString(), result, getModelName(tenant));

        return AiGenerationResponse.builder()
                .generatedText(result)
                .model(getModelName(tenant))
                .logId(aiLog.getId())
                .build();
    }

    public AiSeoResponse generateSeo(AiGenerateSeoRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = getTenant(tenantId);

        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate SEO metadata for an Indian e-commerce product listing.\n");
        prompt.append("Product: ").append(req.getProductName()).append("\n");
        if (req.getCategoryName() != null) prompt.append("Category: ").append(req.getCategoryName()).append("\n");
        if (req.getDescription() != null) prompt.append("Description: ").append(req.getDescription()).append("\n");
        prompt.append("\nReturn a JSON object with exactly these fields:\n");
        prompt.append("- \"seoTitle\": SEO title (max 60 characters)\n");
        prompt.append("- \"seoDescription\": Meta description (max 155 characters)\n");
        prompt.append("- \"seoKeywords\": Array of 5-8 keywords relevant for Indian buyers\n");
        prompt.append("\nReturn ONLY valid JSON, no other text.");

        String result = callAi(tenant, prompt.toString());

        AiGenerationLog aiLog = saveLog(tenantId, req.getProductId(), AiGenerationType.SEO_TITLE,
                prompt.toString(), result, getModelName(tenant));

        try {
            String cleaned = extractJson(result);
            JsonNode json = objectMapper.readTree(cleaned);
            String title = json.has("seoTitle") ? json.get("seoTitle").asText() : "";
            String desc = json.has("seoDescription") ? json.get("seoDescription").asText() : "";
            String[] keywords = new String[0];
            if (json.has("seoKeywords") && json.get("seoKeywords").isArray()) {
                List<String> kwList = new ArrayList<>();
                json.get("seoKeywords").forEach(node -> kwList.add(node.asText()));
                keywords = kwList.toArray(new String[0]);
            }
            return AiSeoResponse.builder()
                    .seoTitle(title)
                    .seoDescription(desc)
                    .seoKeywords(keywords)
                    .model(getModelName(tenant))
                    .logId(aiLog.getId())
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse SEO JSON from AI, returning raw text: {}", e.getMessage());
            return AiSeoResponse.builder()
                    .seoTitle(result.length() > 60 ? result.substring(0, 60) : result)
                    .seoDescription(result.length() > 155 ? result.substring(0, 155) : result)
                    .seoKeywords(new String[]{})
                    .model(getModelName(tenant))
                    .logId(aiLog.getId())
                    .build();
        }
    }

    public List<AiHsnSuggestion> suggestHsn(AiSuggestHsnRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = getTenant(tenantId);

        StringBuilder prompt = new StringBuilder();
        prompt.append("Suggest the top 3 most appropriate HSN (Harmonized System of Nomenclature) codes ");
        prompt.append("for an Indian product.\n");
        prompt.append("Product: ").append(req.getProductName()).append("\n");
        if (req.getCategoryName() != null) prompt.append("Category: ").append(req.getCategoryName()).append("\n");
        if (req.getDescription() != null) prompt.append("Description: ").append(req.getDescription()).append("\n");
        prompt.append("\nReturn a JSON array with objects having: \"code\" (4-8 digit HSN), \"description\", \"gstRate\" (e.g. \"GST_18\").\n");
        prompt.append("Return ONLY valid JSON array, no other text.");

        String result = callAi(tenant, prompt.toString());

        saveLog(tenantId, req.getProductId(), AiGenerationType.HSN_SUGGEST,
                prompt.toString(), result, getModelName(tenant));

        try {
            String cleaned = extractJson(result);
            JsonNode jsonArray = objectMapper.readTree(cleaned);
            List<AiHsnSuggestion> suggestions = new ArrayList<>();
            if (jsonArray.isArray()) {
                for (JsonNode node : jsonArray) {
                    suggestions.add(AiHsnSuggestion.builder()
                            .code(node.has("code") ? node.get("code").asText() : "")
                            .description(node.has("description") ? node.get("description").asText() : "")
                            .gstRate(node.has("gstRate") ? node.get("gstRate").asText() : "")
                            .build());
                }
            }
            return suggestions;
        } catch (Exception e) {
            log.warn("Failed to parse HSN JSON from AI: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public AiGenerationResponse suggestTags(AiSuggestTagsRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = getTenant(tenantId);

        StringBuilder prompt = new StringBuilder();
        prompt.append("Suggest 8-10 product tags for Indian e-commerce search optimization.\n");
        prompt.append("Product: ").append(req.getProductName()).append("\n");
        if (req.getCategoryName() != null) prompt.append("Category: ").append(req.getCategoryName()).append("\n");
        if (req.getDescription() != null) prompt.append("Description: ").append(req.getDescription()).append("\n");
        if (req.getExistingTags() != null && req.getExistingTags().length > 0) {
            prompt.append("Existing tags: ").append(String.join(", ", req.getExistingTags())).append("\n");
        }
        prompt.append("\nReturn tags as a comma-separated list. Focus on terms Indian buyers search for. ");
        prompt.append("Return only the comma-separated tags, nothing else.");

        String result = callAi(tenant, prompt.toString());

        AiGenerationLog aiLog = saveLog(tenantId, req.getProductId(), AiGenerationType.TAGS,
                prompt.toString(), result, getModelName(tenant));

        return AiGenerationResponse.builder()
                .generatedText(result)
                .model(getModelName(tenant))
                .logId(aiLog.getId())
                .build();
    }

    public void acceptGeneration(AiAcceptRequest req) {
        UUID tenantId = TenantContext.getTenantId();
        AiGenerationLog aiLog = logRepository.findById(req.getLogId())
                .orElseThrow(() -> new BadRequestException("AI generation log not found"));

        if (!aiLog.getTenantId().equals(tenantId)) {
            throw new BadRequestException("AI generation log not found");
        }

        aiLog.setAccepted(req.isAccepted());
        logRepository.save(aiLog);
    }

    // --- Private helpers ---

    private String callAi(Tenant tenant, String prompt) {
        if (tenant.getAiProvider() == AiProvider.OPENAI && tenant.getOpenaiApiKey() != null) {
            return callOpenAi(tenant.getOpenaiApiKey(), prompt);
        }
        return callOllama(prompt);
    }

    private String callOllama(String prompt) {
        try {
            String url = aiConfig.getOllamaUrl() + "/api/generate";

            Map<String, Object> body = new HashMap<>();
            body.put("model", aiConfig.getOllamaModel());
            body.put("prompt", prompt);
            body.put("stream", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                return json.has("response") ? json.get("response").asText().trim() : "";
            }

            throw new BadRequestException("Ollama returned empty response");
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Ollama call failed: {}", e.getMessage());
            throw new BadRequestException("AI service unavailable. Ensure Ollama is running on " + aiConfig.getOllamaUrl());
        }
    }

    private String callOpenAi(String apiKey, String prompt) {
        try {
            String url = aiConfig.getOpenaiUrl() + "/chat/completions";

            Map<String, Object> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);

            Map<String, Object> body = new HashMap<>();
            body.put("model", aiConfig.getOpenaiModel());
            body.put("messages", List.of(message));
            body.put("temperature", 0.7);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode json = objectMapper.readTree(response.getBody());
                JsonNode choices = json.get("choices");
                if (choices != null && choices.isArray() && !choices.isEmpty()) {
                    return choices.get(0).get("message").get("content").asText().trim();
                }
            }

            throw new BadRequestException("OpenAI returned empty response");
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("OpenAI call failed: {}", e.getMessage());
            throw new BadRequestException("OpenAI API call failed: " + e.getMessage());
        }
    }

    private Tenant getTenant(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BadRequestException("Tenant not found"));
    }

    private String getModelName(Tenant tenant) {
        if (tenant.getAiProvider() == AiProvider.OPENAI) {
            return aiConfig.getOpenaiModel();
        }
        return aiConfig.getOllamaModel();
    }

    private AiGenerationLog saveLog(UUID tenantId, UUID productId, AiGenerationType type,
                                     String prompt, String output, String model) {
        AiGenerationLog aiLog = new AiGenerationLog();
        aiLog.setTenantId(tenantId);
        aiLog.setProductId(productId);
        aiLog.setGenerationType(type);
        aiLog.setInputPrompt(prompt);
        aiLog.setGeneratedOutput(output);
        aiLog.setModelUsed(model);
        return logRepository.save(aiLog);
    }

    private String extractJson(String text) {
        // Extract JSON from possible markdown code blocks
        if (text.contains("```json")) {
            int start = text.indexOf("```json") + 7;
            int end = text.indexOf("```", start);
            if (end > start) return text.substring(start, end).trim();
        }
        if (text.contains("```")) {
            int start = text.indexOf("```") + 3;
            int end = text.indexOf("```", start);
            if (end > start) return text.substring(start, end).trim();
        }
        // Find first { or [ and last } or ]
        int objStart = text.indexOf('{');
        int arrStart = text.indexOf('[');
        int start = -1;
        if (objStart >= 0 && arrStart >= 0) start = Math.min(objStart, arrStart);
        else if (objStart >= 0) start = objStart;
        else if (arrStart >= 0) start = arrStart;

        if (start >= 0) {
            char open = text.charAt(start);
            char close = open == '{' ? '}' : ']';
            int end = text.lastIndexOf(close);
            if (end > start) return text.substring(start, end + 1);
        }
        return text.trim();
    }
}
