package com.quickcatalog.channel.connector;

import com.quickcatalog.channel.dto.FieldMappingTemplate;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.entity.Product;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MeeshoChannelConnector implements ChannelConnector {

    @Override
    public ChannelType getChannelType() { return ChannelType.MEESHO; }

    @Override
    public ConnectionTestResult testConnection(Channel channel) {
        return ConnectionTestResult.failure("Meesho integration coming soon.");
    }

    @Override
    public PublishResult publishProduct(Product product, Channel channel, ProductChannelListing listing) {
        return PublishResult.failure("Meesho publishing not yet implemented.");
    }

    @Override
    public PublishResult unpublishProduct(ProductChannelListing listing, Channel channel) {
        return PublishResult.failure("Meesho unpublishing not yet implemented.");
    }

    @Override
    public SyncResult syncListing(ProductChannelListing listing, Channel channel) {
        return SyncResult.error("Meesho sync not yet implemented.");
    }

    @Override
    public List<FieldMappingTemplate> getFieldMappingTemplate() {
        return List.of(
                new FieldMappingTemplate("catalog_name", "Catalog Name", true),
                new FieldMappingTemplate("price", "Price", true),
                new FieldMappingTemplate("gst_percentage", "GST %", true)
        );
    }
}
