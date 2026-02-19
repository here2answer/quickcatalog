package com.quickcatalog.ondc.beckn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.ProductImage;
import com.quickcatalog.ondc.beckn.model.*;
import com.quickcatalog.ondc.entity.OndcProductConfig;
import com.quickcatalog.ondc.entity.OndcProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Maps QuickCatalog products to Beckn protocol catalog format.
 * This is the bridge between internal product data and the ONDC network.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogMappingService {

    private final ObjectMapper objectMapper;

    /**
     * Convert a QuickCatalog Product + OndcProductConfig into a BecknItem.
     */
    public BecknItem mapProductToItem(Product product, OndcProductConfig config,
                                       OndcProvider provider) {
        BecknItem item = new BecknItem();
        item.setId(product.getId().toString());

        // Descriptor
        Descriptor descriptor = new Descriptor();
        descriptor.setName(product.getName());
        descriptor.setShortDesc(product.getShortDescription());
        descriptor.setLongDesc(stripHtml(product.getLongDescription()));

        // Images
        List<String> imageUrls = new ArrayList<>();
        if (product.getImages() != null) {
            for (ProductImage img : product.getImages()) {
                String url = img.getLargeUrl() != null ? img.getLargeUrl() : img.getOriginalUrl();
                if (url != null) {
                    imageUrls.add(url);
                }
            }
        }
        descriptor.setImages(imageUrls);
        if (!imageUrls.isEmpty()) {
            descriptor.setSymbol(imageUrls.get(0));
        }
        item.setDescriptor(descriptor);

        // Price (must be strings)
        Price price = new Price();
        price.setCurrency("INR");
        price.setValue(product.getSellingPrice() != null ?
                product.getSellingPrice().toPlainString() : "0");
        price.setMaximumValue(product.getMrp() != null ?
                product.getMrp().toPlainString() : price.getValue());
        item.setPrice(price);

        // Category & fulfillment references
        item.setCategoryId(config.getOndcCategoryId());
        item.setFulfillmentId("ful-1");
        item.setLocationId("loc-1");

        // Quantity
        Quantity quantity = new Quantity();
        Quantity.Available available = new Quantity.Available();
        boolean inStock = product.getCurrentStock() != null &&
                product.getCurrentStock().compareTo(java.math.BigDecimal.ZERO) > 0;
        available.setCount(inStock ? "99" : "0");
        quantity.setAvailable(available);

        if (config.getMaxOrderQuantity() != null) {
            Quantity.Maximum maximum = new Quantity.Maximum();
            maximum.setCount(config.getMaxOrderQuantity().toString());
            quantity.setMaximum(maximum);
        }

        // Unitized measure
        Quantity.Unitized unitized = new Quantity.Unitized();
        Quantity.Measure measure = new Quantity.Measure();
        measure.setUnit(mapUnit(product.getUnit() != null ? product.getUnit().name() : "PCS"));
        measure.setValue("1");
        unitized.setMeasure(measure);
        quantity.setUnitized(unitized);

        item.setQuantity(quantity);

        // ONDC extensions
        item.setReturnable(config.getReturnable() != null ?
                config.getReturnable() : provider.isDefaultReturnable());
        item.setCancellable(config.getCancellable() != null ?
                config.getCancellable() : provider.isDefaultCancellable());
        item.setReturnWindow(config.getReturnWindow() != null ?
                config.getReturnWindow() : provider.getDefaultReturnWindow());
        item.setSellerPickupReturn(config.isSellerPickupReturn());
        item.setTimeToShip(config.getTimeToShip() != null ?
                config.getTimeToShip() : provider.getDefaultTimeToShip());
        item.setAvailableOnCod(config.getCodAvailable() != null ?
                config.getCodAvailable() : provider.isDefaultCodAvailable());

        // Consumer care contact
        String consumerCare = String.format("%s,%s,%s",
                provider.getName(),
                provider.getSupportEmail() != null ? provider.getSupportEmail() : provider.getContactEmail(),
                provider.getSupportPhone() != null ? provider.getSupportPhone() : provider.getContactPhone());
        item.setContactDetailsConsumerCare(consumerCare);

        // Statutory info
        if (config.getStatutoryInfo() != null && !config.getStatutoryInfo().equals("{}")) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, String> statutory = objectMapper.readValue(
                        config.getStatutoryInfo(), Map.class);
                item.setStatutoryPackagedCommodities(statutory);
            } catch (Exception e) {
                log.warn("Failed to parse statutory info for product {}: {}", product.getId(), e.getMessage());
            }
        }

        // Tags
        List<Tag> tags = new ArrayList<>();

        // Origin tag
        Tag originTag = new Tag();
        originTag.setCode("origin");
        originTag.setList(List.of(new Tag.TagItem("country",
                config.getCountryOfOrigin() != null ? config.getCountryOfOrigin() : "IND")));
        tags.add(originTag);

        // Veg/non-veg tag (for food items)
        if (config.getIsVeg() != null || config.getIsNonVeg() != null) {
            Tag vegTag = new Tag();
            vegTag.setCode("veg_nonveg");
            List<Tag.TagItem> vegList = new ArrayList<>();
            if (Boolean.TRUE.equals(config.getIsVeg())) {
                vegList.add(new Tag.TagItem("veg", "yes"));
            }
            if (Boolean.TRUE.equals(config.getIsNonVeg())) {
                vegList.add(new Tag.TagItem("non_veg", "yes"));
            }
            if (Boolean.TRUE.equals(config.getIsEgg())) {
                vegList.add(new Tag.TagItem("egg", "yes"));
            }
            vegTag.setList(vegList);
            tags.add(vegTag);
        }

        item.setTags(tags);

        return item;
    }

    /**
     * Build a full BecknProvider from an OndcProvider entity.
     */
    public BecknProvider mapProvider(OndcProvider provider) {
        BecknProvider becknProvider = new BecknProvider();
        becknProvider.setId(provider.getProviderId());

        // Descriptor
        Descriptor descriptor = new Descriptor();
        descriptor.setName(provider.getName());
        descriptor.setShortDesc(provider.getShortDesc());
        descriptor.setLongDesc(provider.getLongDesc());
        if (provider.getLogoUrl() != null) {
            descriptor.setSymbol(provider.getLogoUrl());
            descriptor.setImages(List.of(provider.getLogoUrl()));
        }
        becknProvider.setDescriptor(descriptor);

        // Location
        Location location = new Location();
        location.setId("loc-1");
        location.setGps(provider.getGpsCoordinates());

        Address address = new Address();
        address.setStreet(provider.getAddressStreet());
        address.setCity(provider.getAddressCity());
        address.setState(provider.getAddressState());
        address.setAreaCode(provider.getAddressAreaCode());
        address.setCountry(provider.getAddressCountry());
        location.setAddress(address);

        // Store timing
        if (provider.getStoreTimingStart() != null && provider.getStoreTimingEnd() != null) {
            Location.LocationTime time = new Location.LocationTime();
            time.setLabel("enable");
            time.setDays(provider.getStoreDays());
            Location.TimeRange range = new Location.TimeRange();
            range.setStart(provider.getStoreTimingStart().toString().replace(":", ""));
            range.setEnd(provider.getStoreTimingEnd().toString().replace(":", ""));
            time.setRange(range);
            location.setTime(time);
        }

        becknProvider.setLocations(List.of(location));

        // Default fulfillment
        BecknFulfillment fulfillment = new BecknFulfillment();
        fulfillment.setId("ful-1");
        fulfillment.setType("Delivery");
        BecknFulfillment.Contact contact = new BecknFulfillment.Contact();
        contact.setPhone(provider.getContactPhone());
        contact.setEmail(provider.getContactEmail());
        fulfillment.setContact(contact);
        becknProvider.setFulfillments(List.of(fulfillment));

        return becknProvider;
    }

    /**
     * Build the full catalog (BecknCatalog) for a provider with their published products.
     */
    public BecknCatalog buildCatalog(OndcProvider provider,
                                      List<Product> products,
                                      List<OndcProductConfig> configs) {
        BecknCatalog catalog = new BecknCatalog();

        // BPP descriptor
        Descriptor bppDescriptor = new Descriptor();
        bppDescriptor.setName(provider.getName());
        bppDescriptor.setShortDesc(provider.getShortDesc());
        if (provider.getLogoUrl() != null) {
            bppDescriptor.setSymbol(provider.getLogoUrl());
            bppDescriptor.setImages(List.of(provider.getLogoUrl()));
        }
        catalog.setBppDescriptor(bppDescriptor);

        // Map configs by product ID for fast lookup
        Map<UUID, OndcProductConfig> configMap = configs.stream()
                .collect(Collectors.toMap(OndcProductConfig::getProductId, c -> c));

        // Build provider with items
        BecknProvider becknProvider = mapProvider(provider);

        List<BecknItem> items = products.stream()
                .filter(p -> configMap.containsKey(p.getId()))
                .map(p -> mapProductToItem(p, configMap.get(p.getId()), provider))
                .collect(Collectors.toList());

        becknProvider.setItems(items);
        catalog.setProviders(List.of(becknProvider));

        return catalog;
    }

    private String mapUnit(String unitType) {
        return switch (unitType) {
            case "KG" -> "kilogram";
            case "GM" -> "gram";
            case "LTR" -> "litre";
            case "ML" -> "millilitre";
            case "MTR" -> "metre";
            case "CM" -> "centimetre";
            case "DOZEN" -> "dozen";
            default -> "unit";
        };
    }

    private String stripHtml(String html) {
        if (html == null) return null;
        return html.replaceAll("<[^>]*>", "").trim();
    }
}
