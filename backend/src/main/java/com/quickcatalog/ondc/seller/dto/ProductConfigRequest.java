package com.quickcatalog.ondc.seller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProductConfigRequest {

    @NotBlank
    private String ondcDomain;

    private String ondcCategoryId;
    private String timeToShip;
    private Boolean returnable;
    private Boolean cancellable;
    private String returnWindow;
    private Boolean sellerPickupReturn;
    private Boolean codAvailable;
    private Integer maxOrderQuantity;
    private String countryOfOrigin;
    private Boolean isVeg;
    private Boolean isNonVeg;
    private Boolean isEgg;
    private String statutoryInfo;
}
