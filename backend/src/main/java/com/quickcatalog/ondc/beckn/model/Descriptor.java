package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Descriptor {
    private String name;
    private String symbol;

    @JsonProperty("short_desc")
    private String shortDesc;

    @JsonProperty("long_desc")
    private String longDesc;

    private List<String> images;
}
