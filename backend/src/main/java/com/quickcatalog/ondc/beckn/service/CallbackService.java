package com.quickcatalog.ondc.beckn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.crypto.Ed25519Service;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

/**
 * Sends signed callbacks (on_search, on_select, etc.) to Buyer App (BAP) URIs.
 * All callbacks are sent asynchronously after returning ACK to the BAP.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CallbackService {

    private final Ed25519Service ed25519Service;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final OndcApiLogService apiLogService;

    /**
     * Send a signed callback to the BAP URI.
     *
     * @param bapUri The BAP's callback URL base
     * @param action The callback action (e.g., "on_search")
     * @param payload The response payload object
     * @param subscriber The ONDC subscriber (contains signing keys)
     * @param tenantId Tenant ID for logging
     * @param transactionId Transaction ID for logging
     */
    @Async("ondcCallbackExecutor")
    public void sendCallback(String bapUri, String action, Object payload,
                             OndcSubscriber subscriber, UUID tenantId, String transactionId) {
        long startTime = System.currentTimeMillis();
        String callbackUrl = bapUri.endsWith("/") ? bapUri + action : bapUri + "/" + action;
        String requestBody = null;

        try {
            requestBody = objectMapper.writeValueAsString(payload);

            // Build signed Authorization header
            String authHeader = ed25519Service.buildAuthorizationHeader(
                    requestBody,
                    subscriber.getSubscriberId(),
                    subscriber.getUniqueKeyId(),
                    subscriber.getSigningPrivateKey()
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", authHeader);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            log.info("Sending ONDC callback {} to {}", action, callbackUrl);
            ResponseEntity<String> response = restTemplate.exchange(
                    callbackUrl, HttpMethod.POST, entity, String.class);

            long duration = System.currentTimeMillis() - startTime;
            log.info("ONDC callback {} completed: status={}, duration={}ms",
                    action, response.getStatusCode(), duration);

            apiLogService.logOutgoing(tenantId, action, transactionId, null,
                    requestBody, response.getBody(),
                    response.getStatusCode().value(), null, duration);

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("ONDC callback {} to {} failed: {}", action, callbackUrl, e.getMessage());

            apiLogService.logOutgoing(tenantId, action, transactionId, null,
                    requestBody, null, 0, e.getMessage(), duration);
        }
    }
}
