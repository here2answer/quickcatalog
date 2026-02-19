package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CancelMessage {
    @JsonProperty("order_id")
    private String orderId;

    @JsonProperty("cancellation_reason_id")
    private String cancellationReasonId;

    private Descriptor descriptor;
}
