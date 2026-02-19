package com.quickcatalog.ondc.beckn.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BecknCatalog {

    @JsonProperty("bpp/descriptor")
    private Descriptor bppDescriptor;

    @JsonProperty("bpp/providers")
    private List<BecknProvider> providers;
}
