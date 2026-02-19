package com.quickcatalog.channel.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PublishRequest {

    private BigDecimal channelPrice;
    private BigDecimal channelComparePrice;
    private String channelSpecificData;
}
