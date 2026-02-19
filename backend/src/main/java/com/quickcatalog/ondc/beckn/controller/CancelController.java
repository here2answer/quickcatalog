package com.quickcatalog.ondc.beckn.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.beckn.service.CancelProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/ondc")
@RequiredArgsConstructor
public class CancelController {

    private final CancelProcessingService cancelProcessingService;
    private final ObjectMapper objectMapper;

    @PostMapping("/cancel")
    public ResponseEntity<BecknResponse> handleCancel(@RequestBody String rawBody) {
        BecknContext context;
        try {
            var request = objectMapper.readTree(rawBody);
            context = objectMapper.treeToValue(request.get("context"), BecknContext.class);
        } catch (Exception e) {
            log.error("Failed to parse cancel request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    BecknResponse.nack(null, new BecknError("JSON-PARSING-ERROR", "400", "Invalid request")));
        }

        log.info("Received /cancel from BAP: {}, txn: {}", context.getBapId(), context.getTransactionId());

        BecknResponse ack = BecknResponse.ack(context);
        cancelProcessingService.processCancelAsync(rawBody, context);

        return ResponseEntity.ok(ack);
    }
}
