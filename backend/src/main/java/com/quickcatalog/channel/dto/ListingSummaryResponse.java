package com.quickcatalog.channel.dto;

import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.channel.entity.enums.ListingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingSummaryResponse {

    private UUID channelId;
    private String channelName;
    private ChannelType channelType;
    private ListingStatus listingStatus;
    private BigDecimal channelPrice;
}
