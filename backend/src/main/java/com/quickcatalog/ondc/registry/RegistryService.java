package com.quickcatalog.ondc.registry;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.config.OndcProperties;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.RegistrationStatus;
import com.quickcatalog.ondc.repository.OndcSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Handles ONDC network registration via the registry /subscribe and /lookup APIs.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RegistryService {

    private final OndcProperties ondcProperties;
    private final OndcSubscriberRepository subscriberRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    /**
     * Initiate subscription with the ONDC registry.
     * Sends subscriber details and public keys to the registry.
     */
    public void subscribe(OndcSubscriber subscriber) {
        OndcProperties.RegistryConfig registryConfig = ondcProperties.getActiveRegistry();

        Map<String, Object> request = new HashMap<>();
        request.put("context", Map.of("operation", Map.of("ops_no", 2)));
        request.put("message", Map.of(
                "request_id", java.util.UUID.randomUUID().toString(),
                "timestamp", java.time.Instant.now().toString(),
                "entity", Map.of(
                        "gst", Map.of("legal_entity_name", ""),
                        "callback_url", subscriber.getSubscriberUrl(),
                        "key_pair", Map.of(
                                "signing_public_key", subscriber.getSigningPublicKey(),
                                "encryption_public_key", subscriber.getEncryptionPublicKey(),
                                "valid_from", java.time.Instant.now().toString(),
                                "valid_until", java.time.Instant.now().plusSeconds(31536000).toString()
                        )
                ),
                "network_participant", List.of(Map.of(
                        "subscriber_url", subscriber.getSubscriberUrl(),
                        "domain", subscriber.getDomain(),
                        "type", "BPP",
                        "msn", false,
                        "city_code", subscriber.getCityCodes() != null ? subscriber.getCityCodes() : new String[]{}
                ))
        ));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String body = objectMapper.writeValueAsString(request);
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            log.info("Subscribing to ONDC registry at {}", registryConfig.getSubscribeUrl());
            ResponseEntity<String> response = restTemplate.exchange(
                    registryConfig.getSubscribeUrl(), HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                subscriber.setRegistrationStatus(RegistrationStatus.INITIATED);
                subscriber.setLastSubscribeAt(LocalDateTime.now());
                subscriberRepository.save(subscriber);
                log.info("ONDC subscription initiated successfully");
            } else {
                subscriber.setRegistrationStatus(RegistrationStatus.FAILED);
                subscriberRepository.save(subscriber);
                log.error("ONDC subscription failed: {}", response.getBody());
            }
        } catch (Exception e) {
            subscriber.setRegistrationStatus(RegistrationStatus.FAILED);
            subscriberRepository.save(subscriber);
            log.error("ONDC subscription failed: {}", e.getMessage());
        }
    }

    /**
     * Lookup a network participant's public key from the ONDC registry.
     * Used to verify incoming request signatures.
     */
    public String lookupPublicKey(String subscriberId, String uniqueKeyId) {
        OndcProperties.RegistryConfig registryConfig = ondcProperties.getActiveRegistry();

        Map<String, Object> request = Map.of(
                "subscriber_id", subscriberId,
                "unique_key_id", uniqueKeyId,
                "type", "BAP"
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String body = objectMapper.writeValueAsString(request);
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    registryConfig.getLookupUrl(), HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.isArray() && !root.isEmpty()) {
                    return root.get(0).path("signing_public_key").asText(null);
                }
            }

            log.warn("Failed to lookup public key for subscriber: {}", subscriberId);
            return null;
        } catch (Exception e) {
            log.error("Registry lookup failed for {}: {}", subscriberId, e.getMessage());
            return null;
        }
    }
}
