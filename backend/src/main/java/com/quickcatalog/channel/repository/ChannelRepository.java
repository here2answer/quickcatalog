package com.quickcatalog.channel.repository;

import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.enums.ChannelType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChannelRepository extends JpaRepository<Channel, UUID> {

    List<Channel> findByTenantId(UUID tenantId);

    List<Channel> findByTenantIdAndActiveTrue(UUID tenantId);

    Optional<Channel> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Channel> findByTenantIdAndChannelType(UUID tenantId, ChannelType channelType);

    boolean existsByTenantIdAndChannelName(UUID tenantId, String channelName);
}
