package com.quickcatalog.channel.connector;

import com.quickcatalog.channel.dto.FieldMappingTemplate;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.entity.Product;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JioMartChannelConnector implements ChannelConnector {

    @Override
    public ChannelType getChannelType() { return ChannelType.JIOMART; }

    @Override
    public ConnectionTestResult testConnection(Channel channel) {
        return ConnectionTestResult.failure("JioMart integration coming soon.");
    }

    @Override
    public PublishResult publishProduct(Product product, Channel channel, ProductChannelListing listing) {
        return PublishResult.failure("JioMart publishing not yet implemented.");
    }

    @Override
    public PublishResult unpublishProduct(ProductChannelListing listing, Channel channel) {
        return PublishResult.failure("JioMart unpublishing not yet implemented.");
    }

    @Override
    public SyncResult syncListing(ProductChannelListing listing, Channel channel) {
        return SyncResult.error("JioMart sync not yet implemented.");
    }

    @Override
    public List<FieldMappingTemplate> getFieldMappingTemplate() {
        return List.of(
                new FieldMappingTemplate("product_name", "Product Name", true),
                new FieldMappingTemplate("ean_code", "EAN/Barcode", true),
                new FieldMappingTemplate("mrp", "MRP", true),
                new FieldMappingTemplate("selling_price", "Selling Price", true)
        );
    }
}
