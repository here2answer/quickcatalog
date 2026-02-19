package com.quickcatalog.ondc.seller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubscriberRequest {

    @NotBlank
    private String subscriberId;

    @NotBlank
    private String subscriberUrl;

    private String environment = "STAGING";
    private String domain;
    private String[] cityCodes;
}
