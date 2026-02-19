package com.quickcatalog.ondc.seller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProviderRequest {

    @NotBlank
    private String name;

    private String shortDesc;
    private String longDesc;
    private String logoUrl;

    @NotBlank
    private String gpsCoordinates;

    @NotBlank
    private String addressStreet;

    @NotBlank
    private String addressCity;

    @NotBlank
    private String addressState;

    @NotBlank
    private String addressAreaCode;

    private String addressCountry = "IND";

    @NotBlank
    private String contactPhone;

    @NotBlank
    private String contactEmail;

    private String supportPhone;
    private String supportEmail;
    private String supportUrl;
    private String fssaiLicenseNo;
    private String storeTimingStart;
    private String storeTimingEnd;
    private String storeDays;
    private String defaultTimeToShip;
    private Boolean defaultReturnable;
    private Boolean defaultCancellable;
    private String defaultReturnWindow;
    private Boolean defaultCodAvailable;
}
