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
 * Handles /cancel requests — processes cancellation with reason codes.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CancelProcessingService {

    private final OndcOrderRepository orderRepository;
    private final OndcSubscriberRepository subscriberRepository;
    private final CallbackService callbackService;
    private final OndcApiLogService apiLogService;
    private final OndcProperties ondcProperties;
    private final ObjectMapper objectMapper;

    @Async("ondcCallbackExecutor")
    public void processCancelAsync(String rawBody, BecknContext context) {
        long startTime = System.currentTimeMillis();

        try {
            logIncoming(rawBody, context);

            var root = objectMapper.readTree(rawBody);
            var messageNode = root.path("message");
            String orderId = messageNode.path("order_id").asText(null);
            String cancellationReasonId = messageNode.path("cancellation_reason_id").asText(null);

            if (orderId == null) {
                log.warn("Cancel request missing order_id");
                return;
            }

            OndcEnvironment env = OndcEnvironment.valueOf(ondcProperties.getEnvironment().toUpperCase());
            OndcSubscriber subscriber = findSubscriber(env);
            if (subscriber == null) return;

            UUID tenantId = subscriber.getTenantId();

            Optional<OndcOrder> orderOpt = orderRepository.findByBecknOrderIdAndTenantId(orderId, tenantId);
            if (orderOpt.isEmpty()) {
                log.warn("Order not found for cancellation: {}", orderId);
                return;
            }

            OndcOrder ondcOrder = orderOpt.get();

            // Only allow cancellation for CREATED or ACCEPTED orders
            if (ondcOrder.getState() != OndcOrderState.CREATED &&
                    ondcOrder.getState() != OndcOrderState.ACCEPTED) {
                log.warn("Cannot cancel order in state: {}", ondcOrder.getState());
                return;
            }

            // Update order state
            ondcOrder.setState(OndcOrderState.CANCELLED);
            ondcOrder.setCancellationReason(cancellationReasonId);
            ondcOrder.setCancelledBy(context.getBapId());
            orderRepository.save(ondcOrder);

            log.info("Cancelled ONDC order: {} (reason: {})", orderId, cancellationReasonId);

            // Build on_cancel response
            BecknOrder responseOrder = new BecknOrder();
            responseOrder.setId(orderId);
            responseOrder.setState("Cancelled");
            responseOrder.setUpdatedAt(Instant.now().toString());

            BecknOrder.Cancellation cancellation = new BecknOrder.Cancellation();
            cancellation.setCancelledBy(context.getBapId());
            BecknOrder.CancelReason reason = new BecknOrder.CancelReason();
            reason.setId(cancellationReasonId);
            cancellation.setReason(reason);
            responseOrder.setCancellation(cancellation);

            // Restore items/quote from stored JSONB
            if (ondcOrder.getItems() != null) {
                responseOrder.setItems(objectMapper.readValue(ondcOrder.getItems(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, BecknItem.class)));
            }
            if (ondcOrder.getQuote() != null) {
                responseOrder.setQuote(objectMapper.readValue(ondcOrder.getQuote(), Quote.class));
            }

            OnCancelMessage message = new OnCancelMessage();
            message.setOrder(responseOrder);

            BecknContext responseContext = buildResponseContext(context, subscriber, "on_cancel");
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("context", responseContext);
            response.put("message", message);

            callbackService.sendCallback(context.getBapUri(), "on_cancel", response,
                    subscriber, tenantId, context.getTransactionId());

            log.info("Cancel processing completed in {}ms", System.currentTimeMillis() - startTime);

        } catch (Exception e) {
            log.error("Failed to process cancel: {}", e.getMessage(), e);
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
                apiLogService.logIncoming(subscriber.getTenantId(), "cancel",
                        context.getTransactionId(), context.getMessageId(),
                        context.getBapId(), rawBody, 200, null);
            }
        } catch (Exception e) {
            log.warn("Could not log incoming cancel: {}", e.getMessage());
        }
    }
}
