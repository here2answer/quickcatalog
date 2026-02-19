package com.quickcatalog.channel.dto;

import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.channel.entity.enums.ListingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingResponse {

    private UUID id;
    private UUID productId;
    private String productName;
    private String productSku;
    private UUID channelId;
    private String channelName;
    private ChannelType channelType;
    private ListingStatus listingStatus;
    private String externalListingId;
    private String externalUrl;
    private BigDecimal channelPrice;
    private BigDecimal channelComparePrice;
    private LocalDateTime lastSyncedAt;
    private String syncError;
}
