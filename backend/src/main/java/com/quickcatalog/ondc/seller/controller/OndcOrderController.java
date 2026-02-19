package com.quickcatalog.ondc.seller.controller;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.common.PagedResponse;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.ondc.entity.*;
import com.quickcatalog.ondc.entity.enums.OndcOrderState;
import com.quickcatalog.ondc.repository.*;
import com.quickcatalog.ondc.seller.dto.OrderDetailResponse;
import com.quickcatalog.ondc.seller.dto.OrderListResponse;
import com.quickcatalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ondc/orders")
@RequiredArgsConstructor
public class OndcOrderController {

    private final OndcOrderRepository orderRepository;
    private final OndcOrderItemRepository orderItemRepository;
    private final OndcFulfillmentRepository fulfillmentRepository;
    private final OndcPaymentRepository paymentRepository;
    private final ProductRepository productRepository;

    @GetMapping
    public ApiResponse<PagedResponse<OrderListResponse>> list(
            @RequestParam(required = false) String state,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId = TenantContext.getTenantId();
        PageRequest pageRequest = PageRequest.of(page, size);

        Page<OndcOrder> orderPage;
        if (state != null && !state.isBlank()) {
            OndcOrderState orderState = OndcOrderState.valueOf(state.toUpperCase());
            orderPage = orderRepository.findByTenantIdAndStateOrderByCreatedAtDesc(tenantId, orderState, pageRequest);
        } else {
            orderPage = orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageRequest);
        }

        List<OrderListResponse> content = orderPage.getContent().stream()
                .map(this::mapToListResponse)
                .collect(Collectors.toList());

        return ApiResponse.success(PagedResponse.of(
                content, page, size, orderPage.getTotalElements(), orderPage.getTotalPages()));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderDetailResponse> getById(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        OndcOrder order = orderRepository.findByIdAndTenantIdWithItems(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("OndcOrder", "id", id));
        return ApiResponse.success(mapToDetailResponse(order));
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<OrderDetailResponse> accept(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        OndcOrder order = orderRepository.findByIdAndTenantIdWithItems(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("OndcOrder", "id", id));

        if (order.getState() != OndcOrderState.CREATED) {
            return ApiResponse.error("Order can only be accepted when in CREATED state, current: " + order.getState());
        }

        order.setState(OndcOrderState.ACCEPTED);
        orderRepository.save(order);
        return ApiResponse.success(mapToDetailResponse(order));
    }

    private OrderListResponse mapToListResponse(OndcOrder order) {
        OrderListResponse dto = new OrderListResponse();
        dto.setId(order.getId());
        dto.setBecknOrderId(order.getBecknOrderId());
        dto.setState(order.getState());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        // Use separate query to avoid lazy loading issues
        List<OndcOrderItem> items = orderItemRepository.findByOndcOrderId(order.getId());
        dto.setItemCount(items.size());
        if (!items.isEmpty()) {
            BigDecimal total = items.stream()
                    .map(OndcOrderItem::getTotalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dto.setTotalAmount(total);
        }

        // Use normalized billing fields
        dto.setBuyerName(order.getBillingName());
        dto.setBuyerPhone(order.getBillingPhone());

        return dto;
    }

    private OrderDetailResponse mapToDetailResponse(OndcOrder order) {
        OrderDetailResponse dto = new OrderDetailResponse();
        dto.setId(order.getId());
        dto.setBecknOrderId(order.getBecknOrderId());
        dto.setState(order.getState());
        dto.setBillingName(order.getBillingName());
        dto.setBillingPhone(order.getBillingPhone());
        dto.setBillingEmail(order.getBillingEmail());
        dto.setBillingAddress(order.getBillingAddress());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        // Map order items with product names
        if (order.getOrderItems() != null) {
            UUID tenantId = TenantContext.getTenantId();
            dto.setItems(order.getOrderItems().stream().map(item -> {
                OrderDetailResponse.OrderItemResponse itemDto = new OrderDetailResponse.OrderItemResponse();
                itemDto.setId(item.getId());
                itemDto.setProductId(item.getProductId());
                itemDto.setQuantity(item.getQuantity());
                itemDto.setUnitPrice(item.getUnitPrice());
                itemDto.setTaxAmount(item.getTaxAmount());
                itemDto.setTotalAmount(item.getTotalPrice());

                if (item.getProductId() != null) {
                    productRepository.findByIdAndTenantId(item.getProductId(), tenantId)
                            .ifPresent(p -> itemDto.setProductName(p.getName()));
                }
                return itemDto;
            }).collect(Collectors.toList()));
        }

        // Map fulfillment
        fulfillmentRepository.findFirstByOndcOrderId(order.getId()).ifPresent(ful -> {
            OrderDetailResponse.FulfillmentSummary fulDto = new OrderDetailResponse.FulfillmentSummary();
            fulDto.setId(ful.getId());
            fulDto.setType(ful.getFulfillmentType());
            fulDto.setState(ful.getFulfillmentState());
            fulDto.setTrackingUrl(ful.getTrackingUrl());
            fulDto.setAgentName(ful.getAgentName());
            fulDto.setAgentPhone(ful.getAgentPhone());
            fulDto.setDeliveryAddress(ful.getDeliveryAddress());
            fulDto.setDeliveryGps(ful.getDeliveryGps());
            dto.setFulfillment(fulDto);
        });

        // Map payment
        paymentRepository.findFirstByOndcOrderId(order.getId()).ifPresent(pay -> {
            OrderDetailResponse.PaymentSummary payDto = new OrderDetailResponse.PaymentSummary();
            payDto.setId(pay.getId());
            payDto.setType(pay.getPaymentType());
            payDto.setCollectedBy(pay.getCollectedBy());
            payDto.setTransactionId(pay.getTransactionId());
            payDto.setSettlementStatus(pay.getSettlementStatus());
            payDto.setBuyerAppFinderFeeAmount(pay.getBuyerAppFinderFeeAmount());
            dto.setPayment(payDto);
        });

        return dto;
    }
}
