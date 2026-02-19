package com.quickcatalog.channel.controller;

import com.quickcatalog.channel.dto.BulkPublishRequest;
import com.quickcatalog.channel.dto.ChannelPricingRequest;
import com.quickcatalog.channel.dto.ListingResponse;
import com.quickcatalog.channel.dto.PublishRequest;
import com.quickcatalog.channel.service.PublishingService;
import com.quickcatalog.dto.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class PublishingController {

    private final PublishingService publishingService;

    @PostMapping("/{id}/publish/{channelId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ListingResponse> publish(@PathVariable UUID id,
                                                 @PathVariable UUID channelId,
                                                 @RequestBody(required = false) PublishRequest request) {
        return ApiResponse.success(publishingService.publishProduct(id, channelId, request));
    }

    @PostMapping("/{id}/unpublish/{channelId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ListingResponse> unpublish(@PathVariable UUID id,
                                                   @PathVariable UUID channelId) {
        return ApiResponse.success(publishingService.unpublishProduct(id, channelId));
    }

    @PostMapping("/bulk-publish/{channelId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<List<ListingResponse>> bulkPublish(@PathVariable UUID channelId,
                                                           @Valid @RequestBody BulkPublishRequest request) {
        return ApiResponse.success(publishingService.bulkPublish(channelId, request));
    }

    @GetMapping("/{id}/listings")
    public ApiResponse<List<ListingResponse>> getListings(@PathVariable UUID id) {
        return ApiResponse.success(publishingService.getListingsForProduct(id));
    }

    @PostMapping("/{id}/listings/{listingId}/sync")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ListingResponse> sync(@PathVariable UUID id,
                                              @PathVariable UUID listingId) {
        return ApiResponse.success(publishingService.syncListing(id, listingId));
    }

    @PutMapping("/{id}/listings/{listingId}/pricing")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ListingResponse> updatePricing(@PathVariable UUID id,
                                                       @PathVariable UUID listingId,
                                                       @Valid @RequestBody ChannelPricingRequest request) {
        return ApiResponse.success(publishingService.updateChannelPricing(id, listingId, request));
    }
}
