package com.quickcatalog.ondc.beckn.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.beckn.service.SearchProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    private final SearchProcessingService searchProcessingService;
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

        // Return ACK immediately, process search asynchronously via separate bean
        BecknResponse ack = BecknResponse.ack(context);
        searchProcessingService.processSearchAsync(rawBody, context);

        return ResponseEntity.ok(ack);
    }
}
