package com.quickcatalog.ondc.seller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubscriberResponse {

    private UUID id;
    private String subscriberId;
    private String subscriberUrl;
    private String environment;
    private String signingPublicKey;
    private String encryptionPublicKey;
    private String uniqueKeyId;
    private String domain;
    private String[] cityCodes;
    private String registrationStatus;
    private LocalDateTime lastSubscribeAt;
    private LocalDateTime createdAt;
}
