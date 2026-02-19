package com.quickcatalog.channel.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ChannelPricingRequest {

    @NotNull
    private BigDecimal channelPrice;

    private BigDecimal channelComparePrice;
}
