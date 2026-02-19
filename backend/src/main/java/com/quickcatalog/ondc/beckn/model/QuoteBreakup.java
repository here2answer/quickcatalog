package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuoteBreakup {

    @JsonProperty("@ondc/org/item_id")
    private String itemId;

    @JsonProperty("@ondc/org/title_type")
    private String titleType;

    private String title;
    private Price price;
    private ItemQuantity item;

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ItemQuantity {
        private Integer count;
    }
}
