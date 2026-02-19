package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Address {
    private String door;
    private String building;
    private String street;
    private String locality;
    private String city;
    private String state;

    @JsonProperty("area_code")
    private String areaCode;

    private String country;
}
