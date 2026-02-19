package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BecknOrder {

    private String id;
    private String state;
    private BecknProvider provider;
    private List<BecknItem> items;
    private Billing billing;
    private BecknFulfillment fulfillment;
    private Quote quote;
    private BecknPayment payment;

    @JsonProperty("created_at")
    private String createdAt;

    @JsonProperty("updated_at")
    private String updatedAt;

    private Cancellation cancellation;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Cancellation {
        @JsonProperty("cancelled_by")
        private String cancelledBy;
        private CancelReason reason;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CancelReason {
        private String id;
    }
}
