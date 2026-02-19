package com.quickcatalog.channel.connector;

import com.quickcatalog.channel.dto.FieldMappingTemplate;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.entity.Product;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AmazonChannelConnector implements ChannelConnector {

    @Override
    public ChannelType getChannelType() { return ChannelType.AMAZON; }

    @Override
    public ConnectionTestResult testConnection(Channel channel) {
        return ConnectionTestResult.failure("Amazon SP-API integration coming soon.");
    }

    @Override
    public PublishResult publishProduct(Product product, Channel channel, ProductChannelListing listing) {
        return PublishResult.failure("Amazon publishing not yet implemented.");
    }

    @Override
    public PublishResult unpublishProduct(ProductChannelListing listing, Channel channel) {
        return PublishResult.failure("Amazon unpublishing not yet implemented.");
    }

    @Override
    public SyncResult syncListing(ProductChannelListing listing, Channel channel) {
        return SyncResult.error("Amazon sync not yet implemented.");
    }

    @Override
    public List<FieldMappingTemplate> getFieldMappingTemplate() {
        return List.of(
                new FieldMappingTemplate("title", "Product Title (max 200 chars)", true),
                new FieldMappingTemplate("brand", "Brand Name", true),
                new FieldMappingTemplate("manufacturer", "Manufacturer", true),
                new FieldMappingTemplate("item_type", "Item Type Keyword", true),
                new FieldMappingTemplate("bullet_points", "Bullet Points", true),
                new FieldMappingTemplate("standard_price", "Price", true),
                new FieldMappingTemplate("quantity", "Quantity", true)
        );
    }
}
