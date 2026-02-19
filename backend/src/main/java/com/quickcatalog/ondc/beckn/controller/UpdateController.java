package com.quickcatalog.ondc.beckn.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.beckn.service.UpdateProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/ondc")
@RequiredArgsConstructor
public class UpdateController {

    private final UpdateProcessingService updateProcessingService;
    private final ObjectMapper objectMapper;

    @PostMapping("/update")
    public ResponseEntity<BecknResponse> handleUpdate(@RequestBody String rawBody) {
        BecknContext context;
        try {
            var request = objectMapper.readTree(rawBody);
            context = objectMapper.treeToValue(request.get("context"), BecknContext.class);
        } catch (Exception e) {
            log.error("Failed to parse update request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    BecknResponse.nack(null, new BecknError("JSON-PARSING-ERROR", "400", "Invalid request")));
        }

        log.info("Received /update from BAP: {}, txn: {}", context.getBapId(), context.getTransactionId());

        BecknResponse ack = BecknResponse.ack(context);
        updateProcessingService.processUpdateAsync(rawBody, context);

        return ResponseEntity.ok(ack);
    }
}
