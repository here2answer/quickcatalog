package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.Map;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BecknPayment {

    private String type;

    @JsonProperty("collected_by")
    private String collectedBy;

    @JsonProperty("@ondc/org/buyer_app_finder_fee_type")
    private String buyerAppFinderFeeType;

    @JsonProperty("@ondc/org/buyer_app_finder_fee_amount")
    private String buyerAppFinderFeeAmount;

    @JsonProperty("@ondc/org/settlement_basis")
    private String settlementBasis;

    @JsonProperty("@ondc/org/settlement_window")
    private String settlementWindow;

    private String uri;
    private String status;
    private Map<String, String> params;
}
