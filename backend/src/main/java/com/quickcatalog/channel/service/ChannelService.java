package com.quickcatalog.channel.service;

import com.quickcatalog.channel.connector.ChannelConnector;
import com.quickcatalog.channel.connector.ChannelConnectorFactory;
import com.quickcatalog.channel.connector.ConnectionTestResult;
import com.quickcatalog.channel.dto.ChannelRequest;
import com.quickcatalog.channel.dto.ChannelResponse;
import com.quickcatalog.channel.dto.ConnectionTestResponse;
import com.quickcatalog.channel.dto.FieldMappingTemplate;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.enums.ListingStatus;
import com.quickcatalog.channel.repository.ChannelRepository;
import com.quickcatalog.channel.repository.ProductChannelListingRepository;
import com.quickcatalog.config.TenantContext;
import com.quickcatalog.entity.enums.ActionType;
import com.quickcatalog.entity.enums.EntityType;
import com.quickcatalog.exception.DuplicateResourceException;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final ProductChannelListingRepository listingRepository;
    private final ChannelConnectorFactory connectorFactory;
    private final ActivityLogService activityLogService;

    public List<ChannelResponse> listChannels() {
        UUID tenantId = TenantContext.getTenantId();
        return channelRepository.findByTenantId(tenantId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ChannelResponse getChannel(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Channel channel = channelRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel", "id", id));
        return mapToResponse(channel);
    }

    @Transactional
    public ChannelResponse createChannel(ChannelRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        if (channelRepository.existsByTenantIdAndChannelName(tenantId, request.getChannelName())) {
            throw new DuplicateResourceException("Channel", "name", request.getChannelName());
        }

        Channel channel = new Channel();
        channel.setTenantId(tenantId);
        channel.setChannelType(request.getChannelType());
        channel.setChannelName(request.getChannelName());
        channel.setCredentials(request.getCredentials());
        channel.setFieldMapping(request.getFieldMapping());
        if (request.getActive() != null) channel.setActive(request.getActive());
        if (request.getSyncFrequency() != null) channel.setSyncFrequency(request.getSyncFrequency());

        Channel saved = channelRepository.save(channel);

        activityLogService.log(tenantId, TenantContext.getUserId(),
                EntityType.CHANNEL, saved.getId(), ActionType.CREATED,
                "{\"channelType\":\"" + saved.getChannelType() + "\"}");

        return mapToResponse(saved);
    }

    @Transactional
    public ChannelResponse updateChannel(UUID id, ChannelRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        Channel channel = channelRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel", "id", id));

        if (!channel.getChannelName().equals(request.getChannelName())
                && channelRepository.existsByTenantIdAndChannelName(tenantId, request.getChannelName())) {
            throw new DuplicateResourceException("Channel", "name", request.getChannelName());
        }

        channel.setChannelName(request.getChannelName());
        channel.setCredentials(request.getCredentials());
        channel.setFieldMapping(request.getFieldMapping());
        if (request.getActive() != null) channel.setActive(request.getActive());
        if (request.getSyncFrequency() != null) channel.setSyncFrequency(request.getSyncFrequency());

        Channel saved = channelRepository.save(channel);

        activityLogService.log(tenantId, TenantContext.getUserId(),
                EntityType.CHANNEL, saved.getId(), ActionType.UPDATED, null);

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteChannel(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Channel channel = channelRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel", "id", id));
        channelRepository.delete(channel);

        activityLogService.log(tenantId, TenantContext.getUserId(),
                EntityType.CHANNEL, id, ActionType.DELETED, null);
    }

    public ConnectionTestResponse testConnection(UUID channelId) {
        UUID tenantId = TenantContext.getTenantId();
        Channel channel = channelRepository.findByIdAndTenantId(channelId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel", "id", channelId));
        ChannelConnector connector = connectorFactory.getConnector(channel.getChannelType());
        ConnectionTestResult result = connector.testConnection(channel);
        return new ConnectionTestResponse(result.isSuccess(), result.getMessage());
    }

    public List<FieldMappingTemplate> getFieldMappingTemplate(UUID channelId) {
        UUID tenantId = TenantContext.getTenantId();
        Channel channel = channelRepository.findByIdAndTenantId(channelId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Channel", "id", channelId));
        ChannelConnector connector = connectorFactory.getConnector(channel.getChannelType());
        return connector.getFieldMappingTemplate();
    }

    private ChannelResponse mapToResponse(Channel channel) {
        long liveCount = listingRepository.countByChannelIdAndListingStatus(
                channel.getId(), ListingStatus.LIVE);
        long pendingCount = listingRepository.countByChannelIdAndListingStatus(
                channel.getId(), ListingStatus.PENDING);
        long errorCount = listingRepository.countByChannelIdAndListingStatus(
                channel.getId(), ListingStatus.ERROR);

        return ChannelResponse.builder()
                .id(channel.getId())
                .channelType(channel.getChannelType())
                .channelName(channel.getChannelName())
                .credentials(maskCredentials(channel.getCredentials()))
                .fieldMapping(channel.getFieldMapping())
                .active(channel.isActive())
                .syncFrequency(channel.getSyncFrequency())
                .lastSyncedAt(channel.getLastSyncedAt())
                .liveListings(liveCount)
                .pendingListings(pendingCount)
                .errorListings(errorCount)
                .createdAt(channel.getCreatedAt())
                .build();
    }

    private String maskCredentials(String credentials) {
        if (credentials == null || credentials.isBlank() || "{}".equals(credentials)) {
            return credentials;
        }
        return "***masked***";
    }
}
