package com.quickcatalog.channel.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class BulkPublishRequest {

    @NotEmpty
    private List<UUID> productIds;

    private BigDecimal defaultChannelPrice;
}
