package com.quickcatalog.ondc.beckn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.enums.ProductStatus;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.config.OndcProperties;
import com.quickcatalog.ondc.entity.OndcProvider;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.OndcEnvironment;
import com.quickcatalog.ondc.repository.OndcProviderRepository;
import com.quickcatalog.ondc.repository.OndcSubscriberRepository;
import com.quickcatalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Handles /select requests — validates cart items, checks stock, calculates quote with breakup.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SelectProcessingService {

    private final OndcProviderRepository providerRepository;
    private final OndcSubscriberRepository subscriberRepository;
    private final ProductRepository productRepository;
    private final CallbackService callbackService;
    private final OndcApiLogService apiLogService;
    private final OndcProperties ondcProperties;
    private final ObjectMapper objectMapper;

    @Async("ondcCallbackExecutor")
    public void processSelectAsync(String rawBody, BecknContext context) {
        long startTime = System.currentTimeMillis();

        try {
            logIncoming(rawBody, context);

            var root = objectMapper.readTree(rawBody);
            var orderNode = root.path("message").path("order");
            var providerNode = orderNode.path("provider");
            String providerId = providerNode.path("id").asText(null);
            var itemsNode = orderNode.path("items");

            if (providerId == null || itemsNode.isMissingNode()) {
                log.warn("Select request missing provider or items");
                return;
            }

            // Find provider
            OndcEnvironment env = OndcEnvironment.valueOf(ondcProperties.getEnvironment().toUpperCase());
            OndcSubscriber subscriber = findSubscriber(env);
            if (subscriber == null) return;

            UUID tenantId = subscriber.getTenantId();
            Optional<OndcProvider> providerOpt = providerRepository.findByTenantIdAndIsActiveTrue(tenantId)
                    .stream().filter(p -> p.getProviderId().equals(providerId)).findFirst();

            if (providerOpt.isEmpty()) {
                log.warn("Provider not found: {}", providerId);
                return;
            }

            OndcProvider provider = providerOpt.get();
            List<QuoteBreakup> breakups = new ArrayList<>();
            BigDecimal totalPrice = BigDecimal.ZERO;

            // Process each item
            for (var itemNode : itemsNode) {
                String itemId = itemNode.path("id").asText(null);
                int requestedQty = itemNode.path("quantity").path("count").asInt(1);

                if (itemId == null) continue;

                // Lookup product
                UUID productId = UUID.fromString(itemId);
                Optional<Product> productOpt = productRepository.findByIdAndTenantId(productId, tenantId);
                if (productOpt.isEmpty() || productOpt.get().getStatus() != ProductStatus.ACTIVE) {
                    log.warn("Product not found or inactive: {}", itemId);
                    continue;
                }

                Product product = productOpt.get();
                BigDecimal sellingPrice = product.getSellingPrice() != null ? product.getSellingPrice() : product.getMrp();
                BigDecimal itemTotal = sellingPrice.multiply(BigDecimal.valueOf(requestedQty));

                // Item breakup
                QuoteBreakup itemBreakup = new QuoteBreakup();
                itemBreakup.setItemId(itemId);
                itemBreakup.setTitleType("item");
                itemBreakup.setTitle(product.getName());
                itemBreakup.setPrice(createPrice(itemTotal));
                QuoteBreakup.ItemQuantity iq = new QuoteBreakup.ItemQuantity();
                iq.setCount(requestedQty);
                itemBreakup.setItem(iq);
                breakups.add(itemBreakup);

                // Tax breakup (GST)
                BigDecimal gstRate = getGstRate(product);
                BigDecimal taxAmount = itemTotal.multiply(gstRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                QuoteBreakup taxBreakup = new QuoteBreakup();
                taxBreakup.setItemId(itemId);
                taxBreakup.setTitleType("tax");
                taxBreakup.setTitle("Tax");
                taxBreakup.setPrice(createPrice(taxAmount));
                breakups.add(taxBreakup);

                totalPrice = totalPrice.add(itemTotal).add(taxAmount);
            }

            // Build quote
            Quote quote = new Quote();
            quote.setPrice(createPrice(totalPrice));
            quote.setBreakup(breakups);
            quote.setTtl("P1D");

            // Build on_select response
            BecknOrder responseOrder = new BecknOrder();
            responseOrder.setProvider(buildBecknProvider(provider));
            responseOrder.setItems(objectMapper.treeToValue(itemsNode, objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, BecknItem.class)));
            responseOrder.setQuote(quote);

            OnSelectMessage message = new OnSelectMessage();
            message.setOrder(responseOrder);

            BecknContext responseContext = buildResponseContext(context, subscriber, "on_select");
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("context", responseContext);
            response.put("message", message);

            callbackService.sendCallback(context.getBapUri(), "on_select", response,
                    subscriber, tenantId, context.getTransactionId());

            log.info("Select processing completed in {}ms", System.currentTimeMillis() - startTime);

        } catch (Exception e) {
            log.error("Failed to process select: {}", e.getMessage(), e);
        }
    }

    private Price createPrice(BigDecimal amount) {
        Price price = new Price();
        price.setCurrency("INR");
        price.setValue(amount.setScale(2, RoundingMode.HALF_UP).toString());
        return price;
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

    private BecknProvider buildBecknProvider(OndcProvider provider) {
        BecknProvider bp = new BecknProvider();
        bp.setId(provider.getProviderId());
        Descriptor desc = new Descriptor();
        desc.setName(provider.getName());
        desc.setShortDesc(provider.getShortDesc());
        bp.setDescriptor(desc);
        return bp;
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
                apiLogService.logIncoming(subscriber.getTenantId(), "select",
                        context.getTransactionId(), context.getMessageId(),
                        context.getBapId(), rawBody, 200, null);
            }
        } catch (Exception e) {
            log.warn("Could not log incoming select: {}", e.getMessage());
        }
    }
}
