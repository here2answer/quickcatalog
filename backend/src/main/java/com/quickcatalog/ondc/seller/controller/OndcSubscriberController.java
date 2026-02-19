package com.quickcatalog.ondc.seller.controller;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.ondc.crypto.KeyGenerationService;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.OndcEnvironment;
import com.quickcatalog.ondc.entity.enums.RegistrationStatus;
import com.quickcatalog.ondc.registry.RegistryService;
import com.quickcatalog.ondc.repository.OndcSubscriberRepository;
import com.quickcatalog.ondc.seller.dto.SubscriberRequest;
import com.quickcatalog.ondc.seller.dto.SubscriberResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/ondc/subscriber")
@RequiredArgsConstructor
public class OndcSubscriberController {

    private final OndcSubscriberRepository subscriberRepository;
    private final KeyGenerationService keyGenerationService;
    private final RegistryService registryService;

    @GetMapping
    public ApiResponse<SubscriberResponse> getSubscriber() {
        UUID tenantId = TenantContext.getTenantId();
        OndcSubscriber subscriber = subscriberRepository.findByTenantId(tenantId).orElse(null);
        if (subscriber == null) {
            return ApiResponse.success(null);
        }
        return ApiResponse.success(mapToResponse(subscriber));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<SubscriberResponse> createOrUpdate(@Valid @RequestBody SubscriberRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        OndcEnvironment env = OndcEnvironment.valueOf(request.getEnvironment().toUpperCase());

        OndcSubscriber subscriber = subscriberRepository
                .findByTenantIdAndEnvironment(tenantId, env)
                .orElse(new OndcSubscriber());

        subscriber.setTenantId(tenantId);
        subscriber.setSubscriberId(request.getSubscriberId());
        subscriber.setSubscriberUrl(request.getSubscriberUrl());
        subscriber.setEnvironment(env);
        subscriber.setDomain(request.getDomain());
        subscriber.setCityCodes(request.getCityCodes());

        if (subscriber.getRegistrationStatus() == null) {
            subscriber.setRegistrationStatus(RegistrationStatus.PENDING);
        }

        OndcSubscriber saved = subscriberRepository.save(subscriber);
        return ApiResponse.success(mapToResponse(saved));
    }

    @PostMapping("/generate-keys")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<SubscriberResponse> generateKeys() {
        UUID tenantId = TenantContext.getTenantId();
        OndcSubscriber subscriber = subscriberRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Subscriber not configured. Create subscriber first."));

        // Generate signing keys (Ed25519)
        KeyGenerationService.KeyPairResult signingKeys = keyGenerationService.generateSigningKeyPair();
        subscriber.setSigningPublicKey(signingKeys.getPublicKey());
        subscriber.setSigningPrivateKey(signingKeys.getPrivateKey());

        // Generate encryption keys (X25519)
        KeyGenerationService.KeyPairResult encryptionKeys = keyGenerationService.generateEncryptionKeyPair();
        subscriber.setEncryptionPublicKey(encryptionKeys.getPublicKey());
        subscriber.setEncryptionPrivateKey(encryptionKeys.getPrivateKey());

        // Generate unique key ID
        subscriber.setUniqueKeyId(UUID.randomUUID().toString());

        OndcSubscriber saved = subscriberRepository.save(subscriber);
        log.info("Generated ONDC key pairs for tenant: {}", tenantId);
        return ApiResponse.success(mapToResponse(saved));
    }

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<SubscriberResponse> register() {
        UUID tenantId = TenantContext.getTenantId();
        OndcSubscriber subscriber = subscriberRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Subscriber not configured"));

        if (subscriber.getSigningPublicKey() == null) {
            throw new RuntimeException("Keys not generated. Call /generate-keys first.");
        }

        registryService.subscribe(subscriber);

        OndcSubscriber updated = subscriberRepository.findById(subscriber.getId()).orElse(subscriber);
        return ApiResponse.success(mapToResponse(updated));
    }

    @GetMapping("/status")
    public ApiResponse<String> getStatus() {
        UUID tenantId = TenantContext.getTenantId();
        OndcSubscriber subscriber = subscriberRepository.findByTenantId(tenantId).orElse(null);
        if (subscriber == null) {
            return ApiResponse.success("NOT_CONFIGURED");
        }
        return ApiResponse.success(subscriber.getRegistrationStatus().name());
    }

    private SubscriberResponse mapToResponse(OndcSubscriber entity) {
        SubscriberResponse dto = new SubscriberResponse();
        dto.setId(entity.getId());
        dto.setSubscriberId(entity.getSubscriberId());
        dto.setSubscriberUrl(entity.getSubscriberUrl());
        dto.setEnvironment(entity.getEnvironment().name());
        dto.setSigningPublicKey(entity.getSigningPublicKey());
        dto.setEncryptionPublicKey(entity.getEncryptionPublicKey());
        dto.setUniqueKeyId(entity.getUniqueKeyId());
        dto.setDomain(entity.getDomain());
        dto.setCityCodes(entity.getCityCodes());
        dto.setRegistrationStatus(entity.getRegistrationStatus().name());
        dto.setLastSubscribeAt(entity.getLastSubscribeAt());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
