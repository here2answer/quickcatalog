package com.quickcatalog.ondc.beckn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.config.OndcProperties;
import com.quickcatalog.ondc.entity.OndcProvider;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.OndcEnvironment;
import com.quickcatalog.ondc.repository.OndcProviderRepository;
import com.quickcatalog.ondc.repository.OndcSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Handles /init requests — validates billing/fulfillment details, prepares order draft.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InitProcessingService {

    private final OndcProviderRepository providerRepository;
    private final OndcSubscriberRepository subscriberRepository;
    private final CallbackService callbackService;
    private final OndcApiLogService apiLogService;
    private final OndcProperties ondcProperties;
    private final ObjectMapper objectMapper;

    @Async("ondcCallbackExecutor")
    public void processInitAsync(String rawBody, BecknContext context) {
        long startTime = System.currentTimeMillis();

        try {
            logIncoming(rawBody, context);

            var root = objectMapper.readTree(rawBody);
            var orderNode = root.path("message").path("order");

            String providerId = orderNode.path("provider").path("id").asText(null);
            var billingNode = orderNode.path("billing");
            var fulfillmentNode = orderNode.path("fulfillment");

            if (providerId == null) {
                log.warn("Init request missing provider");
                return;
            }

            OndcEnvironment env = OndcEnvironment.valueOf(ondcProperties.getEnvironment().toUpperCase());
            OndcSubscriber subscriber = findSubscriber(env);
            if (subscriber == null) return;

            UUID tenantId = subscriber.getTenantId();

            // Validate billing
            if (billingNode.isMissingNode() || billingNode.path("name").isMissingNode()) {
                log.warn("Init request missing billing details");
                return;
            }

            // Build on_init response with order draft
            BecknOrder responseOrder = objectMapper.treeToValue(orderNode, BecknOrder.class);
            responseOrder.setState("Created");
            responseOrder.setId(UUID.randomUUID().toString());

            // Set payment details if not present
            if (responseOrder.getPayment() == null) {
                BecknPayment payment = new BecknPayment();
                payment.setType("ON-ORDER");
                payment.setCollectedBy("BAP");
                payment.setStatus("NOT-PAID");
                responseOrder.setPayment(payment);
            }

            OnInitMessage message = new OnInitMessage();
            message.setOrder(responseOrder);

            BecknContext responseContext = buildResponseContext(context, subscriber, "on_init");
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("context", responseContext);
            response.put("message", message);

            callbackService.sendCallback(context.getBapUri(), "on_init", response,
                    subscriber, tenantId, context.getTransactionId());

            log.info("Init processing completed in {}ms", System.currentTimeMillis() - startTime);

        } catch (Exception e) {
            log.error("Failed to process init: {}", e.getMessage(), e);
        }
    }

    private OndcSubscriber findSubscriber(OndcEnvironment env) {
        return subscriberRepository.findAll().stream()
                .filter(s -> s.getEnvironment() == env)
                .findFirst().orElse(null);
    }

    private BecknContext buildResponseContext(BecknContext incoming, OndcSubscriber subscriber, String action) {
        BecknContext ctx = new BecknContext();
        ctx.setDomain(incoming.getDomain());
        ctx.setCountry(incoming.getCountry());
        ctx.setCity(incoming.getCity());
        ctx.setAction(action);
        ctx.setCoreVersion("1.2.0");
        ctx.setBapId(incoming.getBapId());
        ctx.setBapUri(incoming.getBapUri());
        ctx.setBppId(subscriber.getSubscriberId());
        ctx.setBppUri(subscriber.getSubscriberUrl());
        ctx.setTransactionId(incoming.getTransactionId());
        ctx.setMessageId(UUID.randomUUID().toString());
        ctx.setTimestamp(Instant.now());
        ctx.setTtl("PT30S");
        return ctx;
    }

    private void logIncoming(String rawBody, BecknContext context) {
        try {
            OndcSubscriber subscriber = findSubscriber(
                    OndcEnvironment.valueOf(ondcProperties.getEnvironment().toUpperCase()));
            if (subscriber != null) {
                apiLogService.logIncoming(subscriber.getTenantId(), "init",
                        context.getTransactionId(), context.getMessageId(),
                        context.getBapId(), rawBody, 200, null);
            }
        } catch (Exception e) {
            log.warn("Could not log incoming init: {}", e.getMessage());
        }
    }
}
