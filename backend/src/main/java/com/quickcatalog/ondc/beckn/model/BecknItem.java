package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BecknItem {

    private String id;
    private Descriptor descriptor;
    private Price price;

    @JsonProperty("category_id")
    private String categoryId;

    @JsonProperty("fulfillment_id")
    private String fulfillmentId;

    @JsonProperty("location_id")
    private String locationId;

    private Quantity quantity;

    @JsonProperty("@ondc/org/returnable")
    private Boolean returnable;

    @JsonProperty("@ondc/org/cancellable")
    private Boolean cancellable;

    @JsonProperty("@ondc/org/return_window")
    private String returnWindow;

    @JsonProperty("@ondc/org/seller_pickup_return")
    private Boolean sellerPickupReturn;

    @JsonProperty("@ondc/org/time_to_ship")
    private String timeToShip;

    @JsonProperty("@ondc/org/available_on_cod")
    private Boolean availableOnCod;

    @JsonProperty("@ondc/org/contact_details_consumer_care")
    private String contactDetailsConsumerCare;

    @JsonProperty("@ondc/org/statutory_reqs_packaged_commodities")
    private Map<String, String> statutoryPackagedCommodities;

    @JsonProperty("@ondc/org/statutory_reqs_prepackaged_food")
    private Map<String, String> statutoryPrepackagedFood;

    private List<Tag> tags;
}
