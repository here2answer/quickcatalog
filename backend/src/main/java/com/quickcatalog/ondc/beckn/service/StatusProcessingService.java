package com.quickcatalog.ondc.beckn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.config.OndcProperties;
import com.quickcatalog.ondc.entity.OndcOrder;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.OndcEnvironment;
import com.quickcatalog.ondc.repository.OndcOrderRepository;
import com.quickcatalog.ondc.repository.OndcSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Handles /status requests — fetches order status and maps to Beckn format.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatusProcessingService {

    private final OndcOrderRepository orderRepository;
    private final OndcSubscriberRepository subscriberRepository;
    private final CallbackService callbackService;
    private final OndcApiLogService apiLogService;
    private final OndcProperties ondcProperties;
    private final ObjectMapper objectMapper;

    @Async("ondcCallbackExecutor")
    public void processStatusAsync(String rawBody, BecknContext context) {
        long startTime = System.currentTimeMillis();

        try {
            logIncoming(rawBody, context);

            var root = objectMapper.readTree(rawBody);
            String orderId = root.path("message").path("order_id").asText(null);

            if (orderId == null) {
                log.warn("Status request missing order_id");
                return;
            }

            OndcEnvironment env = OndcEnvironment.valueOf(ondcProperties.getEnvironment().toUpperCase());
            OndcSubscriber subscriber = findSubscriber(env);
            if (subscriber == null) return;

            UUID tenantId = subscriber.getTenantId();

            Optional<OndcOrder> orderOpt = orderRepository.findByBecknOrderIdAndTenantId(orderId, tenantId);
            if (orderOpt.isEmpty()) {
                log.warn("Order not found: {}", orderId);
                return;
            }

            OndcOrder ondcOrder = orderOpt.get();

            // Map to Beckn order
            BecknOrder responseOrder = new BecknOrder();
            responseOrder.setId(ondcOrder.getBecknOrderId());
            responseOrder.setState(mapState(ondcOrder.getState().name()));

            // Restore from stored JSONB
            if (ondcOrder.getItems() != null) {
                responseOrder.setItems(objectMapper.readValue(ondcOrder.getItems(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, BecknItem.class)));
            }
            if (ondcOrder.getBilling() != null) {
                responseOrder.setBilling(objectMapper.readValue(ondcOrder.getBilling(), Billing.class));
            }
            if (ondcOrder.getFulfillment() != null) {
                responseOrder.setFulfillment(objectMapper.readValue(ondcOrder.getFulfillment(), BecknFulfillment.class));
            }
            if (ondcOrder.getPayment() != null) {
                responseOrder.setPayment(objectMapper.readValue(ondcOrder.getPayment(), BecknPayment.class));
            }
            if (ondcOrder.getQuote() != null) {
                responseOrder.setQuote(objectMapper.readValue(ondcOrder.getQuote(), Quote.class));
            }

            responseOrder.setCreatedAt(ondcOrder.getCreatedAt().toString());
            responseOrder.setUpdatedAt(ondcOrder.getUpdatedAt().toString());

            OnStatusMessage message = new OnStatusMessage();
            message.setOrder(responseOrder);

            BecknContext responseContext = buildResponseContext(context, subscriber, "on_status");
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("context", responseContext);
            response.put("message", message);

            callbackService.sendCallback(context.getBapUri(), "on_status", response,
                    subscriber, tenantId, context.getTransactionId());

            log.info("Status processing completed in {}ms", System.currentTimeMillis() - startTime);

        } catch (Exception e) {
            log.error("Failed to process status: {}", e.getMessage(), e);
        }
    }

    private String mapState(String internalState) {
        return switch (internalState) {
            case "CREATED" -> "Created";
            case "ACCEPTED" -> "Accepted";
            case "IN_PROGRESS" -> "In-progress";
            case "COMPLETED" -> "Completed";
            case "CANCELLED" -> "Cancelled";
            case "RETURNED" -> "Returned";
            default -> internalState;
        };
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
                apiLogService.logIncoming(subscriber.getTenantId(), "status",
                        context.getTransactionId(), context.getMessageId(),
                        context.getBapId(), rawBody, 200, null);
            }
        } catch (Exception e) {
            log.warn("Could not log incoming status: {}", e.getMessage());
        }
    }
}
