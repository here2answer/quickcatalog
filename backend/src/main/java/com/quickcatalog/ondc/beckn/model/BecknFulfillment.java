package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BecknFulfillment {

    private String id;
    private String type;
    private Contact contact;
    private FulfillmentState state;
    private FulfillmentEnd start;
    private FulfillmentEnd end;
    private Boolean tracking;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Contact {
        private String phone;
        private String email;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FulfillmentState {
        private Descriptor descriptor;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FulfillmentEnd {
        private Location location;
        private TimeInfo time;
        private Contact contact;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TimeInfo {
        private Location.TimeRange range;
    }
}
