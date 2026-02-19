package com.quickcatalog.channel.service;

import com.quickcatalog.channel.connector.ChannelConnector;
import com.quickcatalog.channel.connector.ChannelConnectorFactory;
import com.quickcatalog.channel.connector.PublishResult;
import com.quickcatalog.channel.connector.SyncResult;
import com.quickcatalog.channel.dto.*;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.entity.enums.ListingStatus;
import com.quickcatalog.channel.repository.ChannelRepository;
import com.quickcatalog.channel.repository.ProductChannelListingRepository;
import com.quickcatalog.config.TenantContext;
import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.enums.ActionType;
import com.quickcatalog.entity.enums.EntityType;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.repository.ProductRepository;
import com.quickcatalog.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublishingService {

    private final ChannelRepository channelRepository;
    private final ProductChannelListingRepository listingRepository;
    private final ProductRepository productRepository;
    private final ChannelConnectorFactory connectorFactory;
    private final ActivityLogService activityLogService;

    @Transactional
    public ListingResponse publishProduct(UUID productId, UUID channelId, PublishRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        Product product = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        Channel channel = channelRepository.findByIdAndTenantId(channelId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel", "id", channelId));

        ProductChannelListing listing = listingRepository
                .findByProductIdAndChannelId(productId, channelId)
                .orElse(new ProductChannelListing());

        listing.setProductId(productId);
        listing.setChannelId(channelId);
        listing.setTenantId(tenantId);
        listing.setListingStatus(ListingStatus.PENDING);

        if (request != null && request.getChannelPrice() != null) {
            listing.setChannelPrice(request.getChannelPrice());
        } else if (listing.getChannelPrice() == null) {
            listing.setChannelPrice(product.getSellingPrice());
        }
        if (request != null && request.getChannelComparePrice() != null) {
            listing.setChannelComparePrice(request.getChannelComparePrice());
        } else if (listing.getChannelComparePrice() == null) {
            listing.setChannelComparePrice(product.getMrp());
        }
        if (request != null && request.getChannelSpecificData() != null) {
            listing.setChannelSpecificData(request.getChannelSpecificData());
        }

        listing = listingRepository.save(listing);

        ChannelConnector connector = connectorFactory.getConnector(channel.getChannelType());
        PublishResult result = connector.publishProduct(product, channel, listing);

        if (result.isSuccess()) {
            listing.setListingStatus(ListingStatus.LIVE);
            listing.setExternalListingId(result.getExternalListingId());
            listing.setExternalUrl(result.getExternalUrl());
            listing.setLastSyncedAt(LocalDateTime.now());
            listing.setSyncError(null);
        } else {
            listing.setListingStatus(ListingStatus.ERROR);
            listing.setSyncError(result.getErrorMessage());
        }
        listing = listingRepository.save(listing);

        activityLogService.log(tenantId, TenantContext.getUserId(),
                EntityType.PRODUCT, productId, ActionType.PUBLISHED,
                "{\"channel\":\"" + channel.getChannelName() + "\",\"status\":\""
                        + listing.getListingStatus() + "\"}");

        return mapToListingResponse(listing, product, channel);
    }

    @Transactional
    public ListingResponse unpublishProduct(UUID productId, UUID channelId) {
        UUID tenantId = TenantContext.getTenantId();

        Channel channel = channelRepository.findByIdAndTenantId(channelId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel", "id", channelId));

        ProductChannelListing listing = listingRepository
                .findByProductIdAndChannelId(productId, channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "productId", productId));

        ChannelConnector connector = connectorFactory.getConnector(channel.getChannelType());
        PublishResult result = connector.unpublishProduct(listing, channel);

        if (result.isSuccess()) {
            listing.setListingStatus(ListingStatus.NOT_LISTED);
            listing.setLastSyncedAt(LocalDateTime.now());
            listing.setSyncError(null);
        } else {
            listing.setSyncError(result.getErrorMessage());
        }
        listing = listingRepository.save(listing);

        activityLogService.log(tenantId, TenantContext.getUserId(),
                EntityType.PRODUCT, productId, ActionType.UNPUBLISHED,
                "{\"channel\":\"" + channel.getChannelName() + "\"}");

        Product product = productRepository.findById(productId).orElse(null);
        return mapToListingResponse(listing, product, channel);
    }

    public List<ListingResponse> bulkPublish(UUID channelId, BulkPublishRequest request) {
        return request.getProductIds().stream()
                .map(pid -> {
                    PublishRequest pubReq = new PublishRequest();
                    pubReq.setChannelPrice(request.getDefaultChannelPrice());
                    return publishProduct(pid, channelId, pubReq);
                })
                .toList();
    }

    public List<ListingResponse> getListingsForProduct(UUID productId) {
        UUID tenantId = TenantContext.getTenantId();
        productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        return listingRepository.findByProductIdAndTenantId(productId, tenantId).stream()
                .map(listing -> {
                    Product p = productRepository.findById(listing.getProductId()).orElse(null);
                    Channel c = channelRepository.findById(listing.getChannelId()).orElse(null);
                    return mapToListingResponse(listing, p, c);
                })
                .toList();
    }

    @Transactional
    public ListingResponse syncListing(UUID productId, UUID listingId) {
        UUID tenantId = TenantContext.getTenantId();
        ProductChannelListing listing = listingRepository.findByIdAndTenantId(listingId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));
        UUID channelId = listing.getChannelId();
        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel", "id", channelId));

        ChannelConnector connector = connectorFactory.getConnector(channel.getChannelType());
        SyncResult result = connector.syncListing(listing, channel);

        listing.setListingStatus(result.getStatus());
        listing.setLastSyncedAt(LocalDateTime.now());
        if (result.getError() != null) {
            listing.setSyncError(result.getError());
        } else {
            listing.setSyncError(null);
        }
        listing = listingRepository.save(listing);

        Product product = productRepository.findById(listing.getProductId()).orElse(null);
        return mapToListingResponse(listing, product, channel);
    }

    @Transactional
    public ListingResponse updateChannelPricing(UUID productId, UUID listingId, ChannelPricingRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        ProductChannelListing listing = listingRepository.findByIdAndTenantId(listingId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));

        listing.setChannelPrice(request.getChannelPrice());
        listing.setChannelComparePrice(request.getChannelComparePrice());
        listing = listingRepository.save(listing);

        Product product = productRepository.findById(listing.getProductId()).orElse(null);
        Channel channel = channelRepository.findById(listing.getChannelId()).orElse(null);
        return mapToListingResponse(listing, product, channel);
    }

    private ListingResponse mapToListingResponse(ProductChannelListing listing, Product product, Channel channel) {
        return ListingResponse.builder()
                .id(listing.getId())
                .productId(listing.getProductId())
                .productName(product != null ? product.getName() : null)
                .productSku(product != null ? product.getSku() : null)
                .channelId(listing.getChannelId())
                .channelName(channel != null ? channel.getChannelName() : null)
                .channelType(channel != null ? channel.getChannelType() : null)
                .listingStatus(listing.getListingStatus())
                .externalListingId(listing.getExternalListingId())
                .externalUrl(listing.getExternalUrl())
                .channelPrice(listing.getChannelPrice())
                .channelComparePrice(listing.getChannelComparePrice())
                .lastSyncedAt(listing.getLastSyncedAt())
                .syncError(listing.getSyncError())
                .build();
    }
}
