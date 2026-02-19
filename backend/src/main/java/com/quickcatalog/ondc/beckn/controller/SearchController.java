package com.quickcatalog.ondc.beckn.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.enums.ProductStatus;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.beckn.service.CallbackService;
import com.quickcatalog.ondc.beckn.service.CatalogMappingService;
import com.quickcatalog.ondc.beckn.service.OndcApiLogService;
import com.quickcatalog.ondc.config.OndcProperties;
import com.quickcatalog.ondc.entity.OndcProductConfig;
import com.quickcatalog.ondc.entity.OndcProvider;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.OndcEnvironment;
import com.quickcatalog.ondc.repository.OndcProductConfigRepository;
import com.quickcatalog.ondc.repository.OndcProviderRepository;
import com.quickcatalog.ondc.repository.OndcSubscriberRepository;
import com.quickcatalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * BPP endpoint for handling Beckn /search requests.
 * Receives a search intent from BAP (via ONDC Gateway), returns ACK immediately,
 * then asynchronously builds the catalog and POSTs on_search callback to BAP.
 */
@Slf4j
@RestController
@RequestMapping("/ondc")
@RequiredArgsConstructor
public class SearchController {

    private final OndcProviderRepository providerRepository;
    private final OndcProductConfigRepository productConfigRepository;
    private final OndcSubscriberRepository subscriberRepository;
    private final ProductRepository productRepository;
    private final CatalogMappingService catalogMappingService;
    private final CallbackService callbackService;
    private final OndcApiLogService apiLogService;
    private final OndcProperties ondcProperties;
    private final ObjectMapper objectMapper;

    @PostMapping("/search")
    public ResponseEntity<BecknResponse> handleSearch(@RequestBody String rawBody) {
        BecknContext context;
        try {
            var request = objectMapper.readTree(rawBody);
            context = objectMapper.treeToValue(request.get("context"), BecknContext.class);
        } catch (Exception e) {
            log.error("Failed to parse search request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    BecknResponse.nack(null, new BecknError("JSON-PARSING-ERROR", "400", "Invalid request")));
        }

        log.info("Received /search from BAP: {}, domain: {}, txn: {}",
                context.getBapId(), context.getDomain(), context.getTransactionId());

        // Return ACK immediately
        BecknResponse ack = BecknResponse.ack(context);

        // Process search asynchronously
        processSearchAsync(rawBody, context);

        return ResponseEntity.ok(ack);
    }

    @Async("ondcCallbackExecutor")
    public void processSearchAsync(String rawBody, BecknContext context) {
        long startTime = System.currentTimeMillis();
        String domain = context.getDomain();

        try {
            // Parse search intent
            String searchQuery = extractSearchQuery(rawBody);
            log.info("Processing search: query='{}', domain='{}'", searchQuery, domain);

            // Find all active subscribers for the current environment
            OndcEnvironment env = OndcEnvironment.valueOf(ondcProperties.getEnvironment().toUpperCase());
            List<OndcSubscriber> subscribers = subscriberRepository.findAll().stream()
                    .filter(s -> s.getEnvironment() == env)
                    .collect(Collectors.toList());

            if (subscribers.isEmpty()) {
                log.warn("No ONDC subscribers found for environment: {}", env);
                return;
            }

            // For each subscriber/tenant, build and send catalog
            for (OndcSubscriber subscriber : subscribers) {
                UUID tenantId = subscriber.getTenantId();

                // Find active providers for this tenant
                List<OndcProvider> providers = providerRepository.findByTenantIdAndIsActiveTrue(tenantId);
                if (providers.isEmpty()) continue;

                for (OndcProvider provider : providers) {
                    // Find published products, optionally filtered by domain
                    List<OndcProductConfig> configs;
                    if (domain != null && !domain.isEmpty()) {
                        configs = productConfigRepository.findPublishedByDomain(tenantId, domain);
                    } else {
                        configs = productConfigRepository.findByTenantIdAndPublishedToOndcTrue(tenantId);
                    }

                    if (configs.isEmpty()) continue;

                    // Load the actual products
                    List<UUID> productIds = configs.stream()
                            .map(OndcProductConfig::getProductId)
                            .collect(Collectors.toList());

                    List<Product> products = productIds.stream()
                            .map(pid -> productRepository.findByIdAndTenantId(pid, tenantId).orElse(null))
                            .filter(p -> p != null && p.getStatus() == ProductStatus.ACTIVE)
                            .collect(Collectors.toList());

                    if (products.isEmpty()) continue;

                    // Filter by search query if provided
                    if (searchQuery != null && !searchQuery.isEmpty()) {
                        String queryLower = searchQuery.toLowerCase();
                        products = products.stream()
                                .filter(p -> p.getName().toLowerCase().contains(queryLower) ||
                                        (p.getShortDescription() != null &&
                                                p.getShortDescription().toLowerCase().contains(queryLower)) ||
                                        (p.getBrand() != null &&
                                                p.getBrand().toLowerCase().contains(queryLower)))
                                .collect(Collectors.toList());
                    }

                    if (products.isEmpty()) continue;

                    // Build catalog
                    BecknCatalog catalog = catalogMappingService.buildCatalog(provider, products, configs);

                    // Build on_search response
                    BecknContext responseContext = buildResponseContext(context, subscriber);
                    OnSearchMessage message = new OnSearchMessage();
                    message.setCatalog(catalog);

                    Map<String, Object> onSearchResponse = new LinkedHashMap<>();
                    onSearchResponse.put("context", responseContext);
                    onSearchResponse.put("message", message);

                    // Send callback
                    callbackService.sendCallback(
                            context.getBapUri(), "on_search", onSearchResponse,
                            subscriber, tenantId, context.getTransactionId());

                    // Log
                    apiLogService.logIncoming(tenantId, "search",
                            context.getTransactionId(), context.getMessageId(),
                            context.getBapId(), rawBody, 200, null);
                }
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("Search processing completed in {}ms", duration);

        } catch (Exception e) {
            log.error("Failed to process search: {}", e.getMessage(), e);
        }
    }

    private BecknContext buildResponseContext(BecknContext incomingContext, OndcSubscriber subscriber) {
        BecknContext ctx = new BecknContext();
        ctx.setDomain(incomingContext.getDomain());
        ctx.setCountry(incomingContext.getCountry());
        ctx.setCity(incomingContext.getCity());
        ctx.setAction("on_search");
        ctx.setCoreVersion("1.2.0");
        ctx.setBapId(incomingContext.getBapId());
        ctx.setBapUri(incomingContext.getBapUri());
        ctx.setBppId(subscriber.getSubscriberId());
        ctx.setBppUri(subscriber.getSubscriberUrl());
        ctx.setTransactionId(incomingContext.getTransactionId());
        ctx.setMessageId(UUID.randomUUID().toString());
        ctx.setTimestamp(Instant.now());
        ctx.setTtl("PT30S");
        return ctx;
    }

    private String extractSearchQuery(String rawBody) {
        try {
            var root = objectMapper.readTree(rawBody);
            var intent = root.path("message").path("intent");
            var itemDescriptor = intent.path("item").path("descriptor");
            if (!itemDescriptor.isMissingNode()) {
                String name = itemDescriptor.path("name").asText(null);
                if (name != null) return name;
            }
            // Also check for category-based search
            var category = intent.path("category").path("id");
            if (!category.isMissingNode()) {
                return category.asText(null);
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to extract search query: {}", e.getMessage());
            return null;
        }
    }
}
