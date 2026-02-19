package com.quickcatalog.ondc.beckn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.config.OndcProperties;
import com.quickcatalog.ondc.entity.OndcOrder;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.OndcEnvironment;
import com.quickcatalog.ondc.entity.enums.OndcOrderState;
import com.quickcatalog.ondc.repository.OndcOrderRepository;
import com.quickcatalog.ondc.repository.OndcSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/**
 * Handles /update requests — processes order updates (fulfillment state changes).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UpdateProcessingService {

    private final OndcOrderRepository orderRepository;
    private final OndcSubscriberRepository subscriberRepository;
    private final CallbackService callbackService;
    private final OndcApiLogService apiLogService;
    private final OndcProperties ondcProperties;
    private final ObjectMapper objectMapper;

    @Async("ondcCallbackExecutor")
    public void processUpdateAsync(String rawBody, BecknContext context) {
        long startTime = System.currentTimeMillis();

        try {
            logIncoming(rawBody, context);

            var root = objectMapper.readTree(rawBody);
            var messageNode = root.path("message");
            var orderNode = messageNode.path("order");
            String updateTarget = messageNode.path("update_target").asText("fulfillment");
            String orderId = orderNode.path("id").asText(null);

            if (orderId == null) {
                log.warn("Update request missing order id");
                return;
            }

            OndcEnvironment env = OndcEnvironment.valueOf(ondcProperties.getEnvironment().toUpperCase());
            OndcSubscriber subscriber = findSubscriber(env);
            if (subscriber == null) return;

            UUID tenantId = subscriber.getTenantId();

            Optional<OndcOrder> orderOpt = orderRepository.findByBecknOrderIdAndTenantId(orderId, tenantId);
            if (orderOpt.isEmpty()) {
                log.warn("Order not found for update: {}", orderId);
                return;
            }

            OndcOrder ondcOrder = orderOpt.get();

            // Apply updates based on target
            if ("fulfillment".equals(updateTarget)) {
                var fulfillmentNode = orderNode.path("fulfillment");
                if (!fulfillmentNode.isMissingNode()) {
                    ondcOrder.setFulfillment(objectMapper.writeValueAsString(fulfillmentNode));

                    String stateDesc = fulfillmentNode.path("state").path("descriptor").path("code").asText(null);
                    if ("Order-delivered".equals(stateDesc)) {
                        ondcOrder.setState(OndcOrderState.COMPLETED);
                    } else if ("Order-picked-up".equals(stateDesc) || "Out-for-delivery".equals(stateDesc)) {
                        ondcOrder.setState(OndcOrderState.IN_PROGRESS);
                    }
                }
            } else if ("items".equals(updateTarget)) {
                var itemsNode = orderNode.path("items");
                if (!itemsNode.isMissingNode()) {
                    ondcOrder.setItems(objectMapper.writeValueAsString(itemsNode));
                }
            }

            orderRepository.save(ondcOrder);
            log.info("Updated ONDC order: {} (target: {})", orderId, updateTarget);

            // Build on_update response
            BecknOrder responseOrder = new BecknOrder();
            responseOrder.setId(orderId);
            responseOrder.setState(mapState(ondcOrder.getState().name()));
            responseOrder.setUpdatedAt(Instant.now().toString());

            if (ondcOrder.getItems() != null) {
                responseOrder.setItems(objectMapper.readValue(ondcOrder.getItems(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, BecknItem.class)));
            }
            if (ondcOrder.getFulfillment() != null) {
                responseOrder.setFulfillment(objectMapper.readValue(ondcOrder.getFulfillment(), BecknFulfillment.class));
            }
            if (ondcOrder.getQuote() != null) {
                responseOrder.setQuote(objectMapper.readValue(ondcOrder.getQuote(), Quote.class));
            }

            OnUpdateMessage message = new OnUpdateMessage();
            message.setOrder(responseOrder);

            BecknContext responseContext = buildResponseContext(context, subscriber, "on_update");
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("context", responseContext);
            response.put("message", message);

            callbackService.sendCallback(context.getBapUri(), "on_update", response,
                    subscriber, tenantId, context.getTransactionId());

            log.info("Update processing completed in {}ms", System.currentTimeMillis() - startTime);

        } catch (Exception e) {
            log.error("Failed to process update: {}", e.getMessage(), e);
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
                apiLogService.logIncoming(subscriber.getTenantId(), "update",
                        context.getTransactionId(), context.getMessageId(),
                        context.getBapId(), rawBody, 200, null);
            }
        } catch (Exception e) {
            log.warn("Could not log incoming update: {}", e.getMessage());
        }
    }
}
