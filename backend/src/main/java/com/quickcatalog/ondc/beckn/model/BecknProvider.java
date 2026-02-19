package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BecknProvider {

    private String id;
    private Descriptor descriptor;
    private List<Location> locations;
    private List<BecknFulfillment> fulfillments;
    private List<BecknItem> items;
    private List<Tag> tags;
}
