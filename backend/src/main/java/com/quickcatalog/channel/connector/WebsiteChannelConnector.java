package com.quickcatalog.channel.connector;

import com.quickcatalog.channel.dto.FieldMappingTemplate;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.channel.entity.enums.ListingStatus;
import com.quickcatalog.entity.Product;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebsiteChannelConnector implements ChannelConnector {

    @Override
    public ChannelType getChannelType() { return ChannelType.WEBSITE; }

    @Override
    public ConnectionTestResult testConnection(Channel channel) {
        return ConnectionTestResult.success("Website channel — manual management only.");
    }

    @Override
    public PublishResult publishProduct(Product product, Channel channel, ProductChannelListing listing) {
        return PublishResult.success("Marked as published to website.", null, null);
    }

    @Override
    public PublishResult unpublishProduct(ProductChannelListing listing, Channel channel) {
        return PublishResult.success("Marked as unpublished from website.", null, null);
    }

    @Override
    public SyncResult syncListing(ProductChannelListing listing, Channel channel) {
        return SyncResult.success(listing.getListingStatus() != null
                ? listing.getListingStatus() : ListingStatus.NOT_LISTED);
    }

    @Override
    public List<FieldMappingTemplate> getFieldMappingTemplate() {
        return List.of();
    }
}
