package com.quickcatalog.ondc.seller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProviderResponse {

    private UUID id;
    private String providerId;
    private String name;
    private String shortDesc;
    private String longDesc;
    private String logoUrl;
    private String gpsCoordinates;
    private String addressStreet;
    private String addressCity;
    private String addressState;
    private String addressAreaCode;
    private String addressCountry;
    private String contactPhone;
    private String contactEmail;
    private String supportPhone;
    private String supportEmail;
    private String supportUrl;
    private String fssaiLicenseNo;
    private String storeTimingStart;
    private String storeTimingEnd;
    private String storeDays;
    private String defaultTimeToShip;
    private boolean defaultReturnable;
    private boolean defaultCancellable;
    private String defaultReturnWindow;
    private boolean defaultCodAvailable;
    private boolean active;
    private LocalDateTime createdAt;
}
