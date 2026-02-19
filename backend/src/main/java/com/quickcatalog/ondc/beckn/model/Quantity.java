package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Quantity {

    private Unitized unitized;
    private Available available;
    private Maximum maximum;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Unitized {
        private Measure measure;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Available {
        private String count;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Maximum {
        private String count;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Measure {
        private String unit;
        private String value;
    }
}
