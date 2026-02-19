package com.quickcatalog.ondc.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "ondc_provider")
public class OndcProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "provider_id")
    private String providerId;

    @Column(name = "name")
    private String name;

    @Column(name = "short_desc")
    private String shortDesc;

    @Column(name = "long_desc", columnDefinition = "TEXT")
    private String longDesc;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "gps_coordinates")
    private String gpsCoordinates;

    @Column(name = "address_street")
    private String addressStreet;

    @Column(name = "address_city")
    private String addressCity;

    @Column(name = "address_state")
    private String addressState;

    @Column(name = "address_area_code")
    private String addressAreaCode;

    @Column(name = "address_country")
    private String addressCountry = "IND";

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "support_phone")
    private String supportPhone;

    @Column(name = "support_email")
    private String supportEmail;

    @Column(name = "support_url")
    private String supportUrl;

    @Column(name = "fssai_license_no")
    private String fssaiLicenseNo;

    @Column(name = "store_timing_start")
    private LocalTime storeTimingStart;

    @Column(name = "store_timing_end")
    private LocalTime storeTimingEnd;

    @Column(name = "store_days")
    private String storeDays = "1,2,3,4,5,6,7";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "holidays", columnDefinition = "jsonb")
    private String holidays;

    @Column(name = "default_time_to_ship")
    private String defaultTimeToShip = "PT24H";

    @Column(name = "default_returnable")
    private boolean defaultReturnable = true;

    @Column(name = "default_cancellable")
    private boolean defaultCancellable = true;

    @Column(name = "default_return_window")
    private String defaultReturnWindow = "P7D";

    @Column(name = "default_cod_available")
    private boolean defaultCodAvailable = false;

    @Column(name = "is_active")
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
