package com.quickcatalog.ondc.registry;

import com.quickcatalog.ondc.config.OndcProperties;
import com.quickcatalog.ondc.crypto.X25519Service;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.RegistrationStatus;
import com.quickcatalog.ondc.repository.OndcSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Handles the ONDC registry on_subscribe callback.
 * During registration, ONDC sends an encrypted challenge that must be
 * decrypted and returned to prove key ownership.
 */
@Slf4j
@RestController
@RequestMapping("/ondc")
@RequiredArgsConstructor
public class OnSubscribeController {

    private final X25519Service x25519Service;
    private final OndcProperties ondcProperties;
    private final OndcSubscriberRepository subscriberRepository;

    @PostMapping("/on_subscribe")
    public ResponseEntity<?> onSubscribe(@RequestBody Map<String, Object> request) {
        try {
            String subscriberId = (String) request.get("subscriber_id");
            String challenge = (String) request.get("challenge");

            if (subscriberId == null || challenge == null) {
                log.error("on_subscribe missing subscriber_id or challenge");
                return ResponseEntity.badRequest().body(Map.of("answer", ""));
            }

            log.info("Received on_subscribe challenge for subscriber: {}", subscriberId);

            // Find the subscriber by ID
            OndcSubscriber subscriber = subscriberRepository.findBySubscriberId(subscriberId)
                    .orElse(null);

            if (subscriber == null) {
                log.error("Unknown subscriber: {}", subscriberId);
                return ResponseEntity.badRequest().body(Map.of("answer", ""));
            }

            // Get ONDC's encryption public key for the current environment
            OndcProperties.RegistryConfig registryConfig = ondcProperties.getActiveRegistry();
            String ondcEncryptionPublicKey = registryConfig.getEncryptionPublicKey();

            // Decrypt the challenge using X25519 key exchange
            String answer = x25519Service.decryptChallenge(
                    challenge,
                    subscriber.getEncryptionPrivateKey(),
                    ondcEncryptionPublicKey
            );

            // Update registration status
            subscriber.setRegistrationStatus(RegistrationStatus.SUBSCRIBED);
            subscriberRepository.save(subscriber);

            log.info("on_subscribe challenge solved for subscriber: {}", subscriberId);
            return ResponseEntity.ok(Map.of("answer", answer));

        } catch (Exception e) {
            log.error("Failed to handle on_subscribe: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("answer", "", "error", e.getMessage()));
        }
    }
}
