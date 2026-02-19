package com.quickcatalog.ondc.beckn.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.entity.Product;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.config.OndcProperties;
import com.quickcatalog.ondc.entity.*;
import com.quickcatalog.ondc.entity.enums.*;
import com.quickcatalog.ondc.repository.*;
import com.quickcatalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * Handles /confirm requests — creates OndcOrder + items + fulfillment + payment,
 * reserves stock, and sends on_confirm callback.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConfirmProcessingService {

    private final OndcOrderRepository orderRepository;
    private final OndcFulfillmentRepository fulfillmentRepository;
    private final OndcPaymentRepository paymentRepository;
    private final OndcProviderRepository providerRepository;
    private final OndcSubscriberRepository subscriberRepository;
    private final ProductRepository productRepository;
    private final CallbackService callbackService;
    private final OndcApiLogService apiLogService;
    private final OndcProperties ondcProperties;
    private final ObjectMapper objectMapper;

    @Async("ondcCallbackExecutor")
    public void processConfirmAsync(String rawBody, BecknContext context) {
        long startTime = System.currentTimeMillis();

        try {
            logIncoming(rawBody, context);

            var root = objectMapper.readTree(rawBody);
            var orderNode = root.path("message").path("order");

            String providerId = orderNode.path("provider").path("id").asText(null);
            String orderId = orderNode.path("id").asText(UUID.randomUUID().toString());

            OndcEnvironment env = OndcEnvironment.valueOf(ondcProperties.getEnvironment().toUpperCase());
            OndcSubscriber subscriber = findSubscriber(env);
            if (subscriber == null) return;

            UUID tenantId = subscriber.getTenantId();

            // Resolve provider
            UUID ondcProviderId = null;
            if (providerId != null) {
                ondcProviderId = providerRepository.findByTenantIdAndIsActiveTrue(tenantId).stream()
                        .filter(p -> p.getProviderId().equals(providerId))
                        .map(OndcProvider::getId)
                        .findFirst().orElse(null);
            }
            if (ondcProviderId == null) {
                ondcProviderId = providerRepository.findByTenantIdAndIsActiveTrue(tenantId).stream()
                        .map(OndcProvider::getId)
                        .findFirst().orElse(null);
            }
            if (ondcProviderId == null) {
                log.error("No active provider found for tenant {}", tenantId);
                return;
            }

            // Create persistent order
            OndcOrder ondcOrder = new OndcOrder();
            ondcOrder.setBecknOrderId(orderId);
            ondcOrder.setTenantId(tenantId);
            ondcOrder.setOndcProviderId(ondcProviderId);
            ondcOrder.setState(OndcOrderState.CREATED);
            ondcOrder.setTransactionId(context.getTransactionId());
            ondcOrder.setBapId(context.getBapId());
            ondcOrder.setBapUri(context.getBapUri());
            ondcOrder.setDomain(context.getDomain());

            // Store JSON blobs for full Beckn protocol fidelity
            if (!orderNode.path("items").isMissingNode()) {
                ondcOrder.setItems(objectMapper.writeValueAsString(orderNode.path("items")));
            }
            if (!orderNode.path("billing").isMissingNode()) {
                ondcOrder.setBilling(objectMapper.writeValueAsString(orderNode.path("billing")));
            }
            if (!orderNode.path("fulfillment").isMissingNode()) {
                ondcOrder.setFulfillment(objectMapper.writeValueAsString(orderNode.path("fulfillment")));
            }
            if (!orderNode.path("payment").isMissingNode()) {
                ondcOrder.setPayment(objectMapper.writeValueAsString(orderNode.path("payment")));
            }
            if (!orderNode.path("quote").isMissingNode()) {
                ondcOrder.setQuote(objectMapper.writeValueAsString(orderNode.path("quote")));
            }

            // Store normalized billing fields for dashboard
            JsonNode billingNode = orderNode.path("billing");
            if (!billingNode.isMissingNode()) {
                ondcOrder.setBillingName(billingNode.path("name").asText(null));
                ondcOrder.setBillingPhone(billingNode.path("phone").asText(null));
                ondcOrder.setBillingEmail(billingNode.path("email").asText(null));
                JsonNode addressNode = billingNode.path("address");
                if (!addressNode.isMissingNode()) {
                    ondcOrder.setBillingAddress(objectMapper.writeValueAsString(addressNode));
                }
            }

            // Create normalized order items + reserve stock
            List<OndcOrderItem> orderItems = new ArrayList<>();
            JsonNode itemsNode = orderNode.path("items");
            if (itemsNode.isArray()) {
                for (JsonNode itemNode : itemsNode) {
                    String itemId = itemNode.path("id").asText(null);
                    int qty = itemNode.path("quantity").path("count").asInt(1);
                    if (itemId == null) continue;

                    try {
                        UUID productId = UUID.fromString(itemId);
                        Optional<Product> productOpt = productRepository.findByIdAndTenantId(productId, tenantId);
                        if (productOpt.isEmpty()) continue;

                        Product product = productOpt.get();
                        BigDecimal unitPrice = product.getSellingPrice() != null ?
                                product.getSellingPrice() : product.getMrp();
                        BigDecimal gstRate = getGstRate(product);
                        BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(qty));
                        BigDecimal taxAmount = itemTotal.multiply(gstRate)
                                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                        OndcOrderItem orderItem = new OndcOrderItem();
                        orderItem.setOndcOrder(ondcOrder);
                        orderItem.setProductId(productId);
                        orderItem.setQuantity(qty);
                        orderItem.setUnitPrice(unitPrice);
                        orderItem.setTaxAmount(taxAmount);
                        orderItem.setTotalPrice(itemTotal.add(taxAmount));
                        orderItems.add(orderItem);

                        // Reserve stock
                        if (product.isTrackInventory() && product.getCurrentStock() != null) {
                            BigDecimal newStock = product.getCurrentStock()
                                    .subtract(BigDecimal.valueOf(qty));
                            if (newStock.compareTo(BigDecimal.ZERO) < 0) {
                                newStock = BigDecimal.ZERO;
                            }
                            product.setCurrentStock(newStock);
                            productRepository.save(product);
                            log.info("Reserved {} units of product {}, stock: {} -> {}",
                                    qty, product.getName(),
                                    product.getCurrentStock().add(BigDecimal.valueOf(qty)), newStock);
                        }
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid product ID in confirm: {}", itemId);
                    }
                }
            }

            ondcOrder.setOrderItems(orderItems);
            OndcOrder savedOrder = orderRepository.save(ondcOrder);
            log.info("Created ONDC order: {} (becknId: {}) with {} items",
                    savedOrder.getId(), orderId, orderItems.size());

            // Create fulfillment record
            OndcFulfillment fulfillment = new OndcFulfillment();
            fulfillment.setOndcOrderId(savedOrder.getId());
            fulfillment.setFulfillmentType(FulfillmentType.DELIVERY);
            fulfillment.setFulfillmentState(FulfillmentState.PENDING);

            JsonNode fulfillmentNode = orderNode.path("fulfillment");
            if (!fulfillmentNode.isMissingNode()) {
                JsonNode endNode = fulfillmentNode.path("end");
                if (!endNode.isMissingNode()) {
                    JsonNode locationNode = endNode.path("location");
                    if (!locationNode.isMissingNode()) {
                        fulfillment.setDeliveryGps(locationNode.path("gps").asText(null));
                        fulfillment.setDeliveryAddress(
                                objectMapper.writeValueAsString(locationNode.path("address")));
                    }
                }
                String fulType = fulfillmentNode.path("type").asText(null);
                if ("Self-Pickup".equalsIgnoreCase(fulType)) {
                    fulfillment.setFulfillmentType(FulfillmentType.SELF_PICKUP);
                }
            }
            fulfillmentRepository.save(fulfillment);

            // Create payment record
            OndcPayment payment = new OndcPayment();
            payment.setOndcOrderId(savedOrder.getId());

            JsonNode paymentNode = orderNode.path("payment");
            if (!paymentNode.isMissingNode()) {
                String payType = paymentNode.path("type").asText("PRE-FULFILLMENT");
                if ("ON-ORDER".equals(payType) || "PRE-FULFILLMENT".equals(payType)) {
                    payment.setPaymentType(PaymentType.PRE_PAID);
                } else if ("ON-FULFILLMENT".equals(payType)) {
                    payment.setPaymentType(PaymentType.ON_DELIVERY);
                } else if ("POST-FULFILLMENT".equals(payType)) {
                    payment.setPaymentType(PaymentType.POST_FULFILLMENT);
                }
                payment.setCollectedBy(paymentNode.path("collected_by").asText("BAP"));
                payment.setTransactionId(paymentNode.path("params").path("transaction_id").asText(null));

                JsonNode finderFee = paymentNode.path("@ondc/org/buyer_app_finder_fee_type");
                if (!finderFee.isMissingNode()) {
                    payment.setBuyerAppFinderFeeType(finderFee.asText());
                }
                JsonNode finderFeeAmount = paymentNode.path("@ondc/org/buyer_app_finder_fee_amount");
                if (!finderFeeAmount.isMissingNode()) {
                    payment.setBuyerAppFinderFeeAmount(new BigDecimal(finderFeeAmount.asText("0")));
                }
                JsonNode settlementBasis = paymentNode.path("@ondc/org/settlement_basis");
                if (!settlementBasis.isMissingNode()) {
                    payment.setSettlementBasis(settlementBasis.asText());
                }
                JsonNode settlementWindow = paymentNode.path("@ondc/org/settlement_window");
                if (!settlementWindow.isMissingNode()) {
                    payment.setSettlementWindow(settlementWindow.asText());
                }
            }
            payment.setSettlementStatus(SettlementStatus.PENDING);
            paymentRepository.save(payment);

            // Build on_confirm response
            BecknOrder responseOrder = objectMapper.treeToValue(orderNode, BecknOrder.class);
            responseOrder.setId(orderId);
            responseOrder.setState("Accepted");
            responseOrder.setCreatedAt(Instant.now().toString());
            responseOrder.setUpdatedAt(Instant.now().toString());

            OnConfirmMessage message = new OnConfirmMessage();
            message.setOrder(responseOrder);

            BecknContext responseContext = buildResponseContext(context, subscriber, "on_confirm");
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("context", responseContext);
            response.put("message", message);

            callbackService.sendCallback(context.getBapUri(), "on_confirm", response,
                    subscriber, tenantId, context.getTransactionId());

            log.info("Confirm processing completed in {}ms", System.currentTimeMillis() - startTime);

        } catch (Exception e) {
            log.error("Failed to process confirm: {}", e.getMessage(), e);
        }
    }

    private BigDecimal getGstRate(Product product) {
        if (product.getGstRate() == null) return BigDecimal.ZERO;
        return switch (product.getGstRate()) {
            case GST_0 -> BigDecimal.ZERO;
            case GST_5 -> BigDecimal.valueOf(5);
            case GST_12 -> BigDecimal.valueOf(12);
            case GST_18 -> BigDecimal.valueOf(18);
            case GST_28 -> BigDecimal.valueOf(28);
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
                apiLogService.logIncoming(subscriber.getTenantId(), "confirm",
                        context.getTransactionId(), context.getMessageId(),
                        context.getBapId(), rawBody, 200, null);
            }
        } catch (Exception e) {
            log.warn("Could not log incoming confirm: {}", e.getMessage());
        }
    }
}
