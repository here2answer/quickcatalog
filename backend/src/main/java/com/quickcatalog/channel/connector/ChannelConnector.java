package com.quickcatalog.channel.connector;

import com.quickcatalog.channel.dto.FieldMappingTemplate;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.entity.Product;

import java.util.List;

public interface ChannelConnector {

    ChannelType getChannelType();

    ConnectionTestResult testConnection(Channel channel);

    PublishResult publishProduct(Product product, Channel channel, ProductChannelListing listing);

    PublishResult unpublishProduct(ProductChannelListing listing, Channel channel);

    SyncResult syncListing(ProductChannelListing listing, Channel channel);

    List<FieldMappingTemplate> getFieldMappingTemplate();
}
