package com.quickcatalog.channel.connector;

import com.quickcatalog.channel.dto.FieldMappingTemplate;
import com.quickcatalog.channel.entity.Channel;
import com.quickcatalog.channel.entity.ProductChannelListing;
import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.channel.entity.enums.ListingStatus;
import com.quickcatalog.entity.Product;
import com.quickcatalog.ondc.entity.OndcProductConfig;
import com.quickcatalog.ondc.entity.OndcProvider;
import com.quickcatalog.ondc.entity.OndcSubscriber;
import com.quickcatalog.ondc.entity.enums.RegistrationStatus;
import com.quickcatalog.ondc.repository.OndcProductConfigRepository;
import com.quickcatalog.ondc.repository.OndcProviderRepository;
import com.quickcatalog.ondc.repository.OndcSubscriberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OndcChannelConnector implements ChannelConnector {

    private final OndcProductConfigRepository ondcProductConfigRepository;
    private final OndcProviderRepository ondcProviderRepository;
    private final OndcSubscriberRepository ondcSubscriberRepository;

    @Override
    public ChannelType getChannelType() {
        return ChannelType.ONDC;
    }

    @Override
    public ConnectionTestResult testConnection(Channel channel) {
        UUID tenantId = channel.getTenantId();

        Optional<OndcSubscriber> subscriber = ondcSubscriberRepository.findByTenantId(tenantId);
        if (subscriber.isEmpty()) {
            return ConnectionTestResult.failure(
                    "ONDC subscriber not configured. Go to Settings > ONDC to set up your subscriber.");
        }
        if (subscriber.get().getRegistrationStatus() != RegistrationStatus.SUBSCRIBED) {
            return ConnectionTestResult.failure(
                    "ONDC subscriber status: " + subscriber.get().getRegistrationStatus()
                            + ". Must be SUBSCRIBED.");
        }

        List<OndcProvider> providers = ondcProviderRepository.findByTenantIdAndIsActiveTrue(tenantId);
        if (providers.isEmpty()) {
            return ConnectionTestResult.failure("No active ONDC providers configured.");
        }

        return ConnectionTestResult.success(
                "Connected. Subscriber: " + subscriber.get().getSubscriberId()
                        + ", Providers: " + providers.size());
    }

    @Override
    public PublishResult publishProduct(Product product, Channel channel, ProductChannelListing listing) {
        UUID tenantId = channel.getTenantId();

        OndcProductConfig config = ondcProductConfigRepository
                .findByProductIdAndTenantId(product.getId(), tenantId)
                .orElse(null);

        if (config == null) {
            OndcProvider provider = ondcProviderRepository
                    .findByTenantIdAndIsActiveTrue(tenantId).stream().findFirst().orElse(null);
            if (provider == null) {
                return PublishResult.failure("No active ONDC provider. Set up provider first.");
            }
            config = new OndcProductConfig();
            config.setProductId(product.getId());
            config.setTenantId(tenantId);
            config.setOndcDomain("ONDC:RET10");
            config.setTimeToShip(provider.getDefaultTimeToShip());
            config.setReturnable(provider.isDefaultReturnable());
            config.setCancellable(provider.isDefaultCancellable());
            config.setReturnWindow(provider.getDefaultReturnWindow());
            config.setCodAvailable(provider.isDefaultCodAvailable());
            config = ondcProductConfigRepository.save(config);
        }

        config.setPublishedToOndc(true);
        config.setLastPublishedAt(LocalDateTime.now());
        ondcProductConfigRepository.save(config);

        log.info("Published product {} to ONDC for tenant {}", product.getId(), tenantId);
        return PublishResult.success("Published to ONDC", config.getId().toString(), null);
    }

    @Override
    public PublishResult unpublishProduct(ProductChannelListing listing, Channel channel) {
        OndcProductConfig config = ondcProductConfigRepository
                .findByProductIdAndTenantId(listing.getProductId(), channel.getTenantId())
                .orElse(null);
        if (config != null) {
            config.setPublishedToOndc(false);
            ondcProductConfigRepository.save(config);
        }
        return PublishResult.success("Unpublished from ONDC", null, null);
    }

    @Override
    public SyncResult syncListing(ProductChannelListing listing, Channel channel) {
        OndcProductConfig config = ondcProductConfigRepository
                .findByProductIdAndTenantId(listing.getProductId(), channel.getTenantId())
                .orElse(null);
        if (config == null) {
            return SyncResult.error("ONDC config missing for this product");
        }
        return SyncResult.success(config.isPublishedToOndc() ? ListingStatus.LIVE : ListingStatus.NOT_LISTED);
    }

    @Override
    public List<FieldMappingTemplate> getFieldMappingTemplate() {
        return List.of(new FieldMappingTemplate(
                "ondcProductConfig",
                "ONDC uses a dedicated product configuration (domain, category, time-to-ship, "
                        + "returnable, etc.). Configure via the ONDC Product Config panel.",
                false
        ));
    }
}
