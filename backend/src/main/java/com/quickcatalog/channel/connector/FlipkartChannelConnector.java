package com.quickcatalog.channel.connector;

import com.quickcatalog.channel.dto.FieldMappingTemplate;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.entity.Product;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class FlipkartChannelConnector implements ChannelConnector {

    @Override
    public ChannelType getChannelType() { return ChannelType.FLIPKART; }

    @Override
    public ConnectionTestResult testConnection(Channel channel) {
        return ConnectionTestResult.failure("Flipkart Seller API integration coming soon.");
    }

    @Override
    public PublishResult publishProduct(Product product, Channel channel, ProductChannelListing listing) {
        return PublishResult.failure("Flipkart publishing not yet implemented.");
    }

    @Override
    public PublishResult unpublishProduct(ProductChannelListing listing, Channel channel) {
        return PublishResult.failure("Flipkart unpublishing not yet implemented.");
    }

    @Override
    public SyncResult syncListing(ProductChannelListing listing, Channel channel) {
        return SyncResult.error("Flipkart sync not yet implemented.");
    }

    @Override
    public List<FieldMappingTemplate> getFieldMappingTemplate() {
        return List.of(
                new FieldMappingTemplate("product_title", "Product Title", true),
                new FieldMappingTemplate("brand", "Brand", true),
                new FieldMappingTemplate("flipkart_serial_number", "FSN", false),
                new FieldMappingTemplate("mrp", "Maximum Retail Price", true),
                new FieldMappingTemplate("selling_price", "Selling Price", true)
        );
    }
}
