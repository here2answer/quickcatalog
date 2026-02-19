package com.quickcatalog.ondc.beckn.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.beckn.service.SelectProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/ondc")
@RequiredArgsConstructor
public class SelectController {

    private final SelectProcessingService selectProcessingService;
    private final ObjectMapper objectMapper;

    @PostMapping("/select")
    public ResponseEntity<BecknResponse> handleSelect(@RequestBody String rawBody) {
        BecknContext context;
        try {
            var request = objectMapper.readTree(rawBody);
            context = objectMapper.treeToValue(request.get("context"), BecknContext.class);
        } catch (Exception e) {
            log.error("Failed to parse select request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    BecknResponse.nack(null, new BecknError("JSON-PARSING-ERROR", "400", "Invalid request")));
        }

        log.info("Received /select from BAP: {}, txn: {}", context.getBapId(), context.getTransactionId());

        BecknResponse ack = BecknResponse.ack(context);
        selectProcessingService.processSelectAsync(rawBody, context);

        return ResponseEntity.ok(ack);
    }
}
