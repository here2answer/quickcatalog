package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SearchMessage {

    private Intent intent;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Intent {
        private ItemIntent item;
        private FulfillmentIntent fulfillment;
        private PaymentIntent payment;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ItemIntent {
        private Descriptor descriptor;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FulfillmentIntent {
        private String type;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PaymentIntent {
        private String type;
    }
}
