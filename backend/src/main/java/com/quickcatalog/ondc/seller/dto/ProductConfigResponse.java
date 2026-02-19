package com.quickcatalog.ondc.seller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductConfigResponse {

    private UUID id;
    private UUID productId;
    private String ondcDomain;
    private String ondcCategoryId;
    private String timeToShip;
    private Boolean returnable;
    private Boolean cancellable;
    private String returnWindow;
    private boolean sellerPickupReturn;
    private Boolean codAvailable;
    private Integer maxOrderQuantity;
    private String countryOfOrigin;
    private Boolean isVeg;
    private Boolean isNonVeg;
    private Boolean isEgg;
    private String statutoryInfo;
    private boolean publishedToOndc;
    private LocalDateTime lastPublishedAt;
}
