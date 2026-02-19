package com.quickcatalog.channel.repository;

import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.entity.enums.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductChannelListingRepository extends JpaRepository<ProductChannelListing, UUID> {

    List<ProductChannelListing> findByProductIdAndTenantId(UUID productId, UUID tenantId);

    Optional<ProductChannelListing> findByProductIdAndChannelId(UUID productId, UUID channelId);

    Optional<ProductChannelListing> findByIdAndTenantId(UUID id, UUID tenantId);

    List<ProductChannelListing> findByChannelIdAndTenantId(UUID channelId, UUID tenantId);

    List<ProductChannelListing> findByTenantIdAndListingStatus(UUID tenantId, ListingStatus status);

    long countByChannelIdAndListingStatus(UUID channelId, ListingStatus status);

    long countByTenantIdAndListingStatus(UUID tenantId, ListingStatus status);
}
