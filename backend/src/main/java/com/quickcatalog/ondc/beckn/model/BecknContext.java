package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.Instant;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BecknContext {

    private String domain;
    private String country;
    private String city;
    private String action;

    @JsonProperty("core_version")
    private String coreVersion;

    @JsonProperty("bap_id")
    private String bapId;

    @JsonProperty("bap_uri")
    private String bapUri;

    @JsonProperty("bpp_id")
    private String bppId;

    @JsonProperty("bpp_uri")
    private String bppUri;

    @JsonProperty("transaction_id")
    private String transactionId;

    @JsonProperty("message_id")
    private String messageId;

    private Instant timestamp;

    private String ttl;
}
