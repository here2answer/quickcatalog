# QuickCatalog — ONDC Integration Spec

## Overview

This spec defines how QuickCatalog integrates with ONDC (Open Network for Digital Commerce) as a **BPP (Beckn Provider Platform)** — a Seller App. Products created in QuickCatalog become discoverable and purchasable by customers using any ONDC Buyer App (Paytm ONDC, Mystore, Magicpin, etc.).

### How It Works

```
Customer → Buyer App (BAP)
               ↓
         ONDC Gateway (routes search)
               ↓
         QuickCatalog BPP (this integration)
               ↓
         QuickCatalog DB (products, orders)
```

**Key principle**: All Beckn APIs are **asynchronous**. The BPP receives a request, returns an ACK immediately, processes async, then POSTs the callback (`on_*`) to the BAP's URL.

### Supported ONDC Retail Domains

| Code | Category | Statutory Requirements |
|------|----------|----------------------|
| RET10 | Grocery | Packaged commodities info |
| RET11 | Food & Beverages | FSSAI license, nutritional info |
| RET12 | Fashion | Country of origin, wash care |
| RET13 | Beauty & Personal Care | Ingredient list, expiry |
| RET14 | Electronics | Warranty, SAR value |
| RET15 | Appliances | Energy rating, warranty |
| RET16 | Home & Decor | Dimensions, material |

---

## Data Model (New Entities)

### 1. ONDC Provider (Store/Location on ONDC)

```
ondc_provider
├── id (UUID, PK)
├── tenant_id (FK → tenant.id)
├── provider_id (VARCHAR — unique ID sent to ONDC, e.g., "QC-{tenant_short}")
├── name
├── short_desc
├── long_desc
├── logo_url
├── gps_coordinates (VARCHAR — "lat,lng")
├── address_street
├── address_city
├── address_state
├── address_area_code (PIN code)
├── address_country (default "IND")
├── contact_phone
├── contact_email
├── support_phone
├── support_email
├── support_url (nullable)
├── fssai_license_no (nullable — required for RET10/RET11)
├── store_timing_start (TIME — e.g., 09:00)
├── store_timing_end (TIME — e.g., 21:00)
├── store_days (VARCHAR — "1,2,3,4,5,6,7")
├── holidays (JSONB — ["2026-01-26","2026-08-15"])
├── default_time_to_ship (VARCHAR — ISO 8601, e.g., "PT24H")
├── default_returnable (BOOLEAN, default true)
├── default_cancellable (BOOLEAN, default true)
├── default_return_window (VARCHAR — e.g., "P7D")
├── default_cod_available (BOOLEAN, default false)
├── is_active (BOOLEAN)
├── created_at, updated_at
```

### 2. ONDC Subscriber (Network Registration)

```
ondc_subscriber
├── id (UUID, PK)
├── tenant_id (FK → tenant.id)
├── subscriber_id (VARCHAR — FQDN, e.g., "quickcatalog.example.com")
├── subscriber_url (VARCHAR — callback base URL)
├── environment (ENUM: STAGING, PRE_PROD, PRODUCTION)
├── signing_public_key (TEXT — Ed25519, base64)
├── signing_private_key (TEXT — Ed25519, base64, encrypted at rest)
├── encryption_public_key (TEXT — X25519, base64)
├── encryption_private_key (TEXT — X25519, base64, encrypted at rest)
├── unique_key_id (VARCHAR — key identifier for auth headers)
├── domain (VARCHAR — e.g., "ONDC:RET10,ONDC:RET12")
├── city_codes (TEXT ARRAY — e.g., ["std:080","std:011"])
├── registration_status (ENUM: PENDING, INITIATED, SUBSCRIBED, FAILED)
├── last_subscribe_at (TIMESTAMP)
├── created_at, updated_at
```

### 3. ONDC Product Config (Per-product ONDC-specific fields)

```
ondc_product_config
├── id (UUID, PK)
├── product_id (FK → product.id)
├── tenant_id (FK → tenant.id)
├── ondc_domain (VARCHAR — "ONDC:RET12" etc.)
├── ondc_category_id (VARCHAR — ONDC category code)
├── time_to_ship (VARCHAR — ISO 8601, e.g., "PT24H", overrides provider default)
├── returnable (BOOLEAN, nullable — overrides provider default)
├── cancellable (BOOLEAN, nullable — overrides provider default)
├── return_window (VARCHAR, nullable — e.g., "P7D")
├── seller_pickup_return (BOOLEAN, default true)
├── cod_available (BOOLEAN, nullable)
├── max_order_quantity (INT, nullable — e.g., 5)
├── country_of_origin (VARCHAR, default "IND")
├── is_veg (BOOLEAN, nullable — for food items)
├── is_non_veg (BOOLEAN, nullable)
├── is_egg (BOOLEAN, nullable)
├── statutory_info (JSONB — manufacturer, packer, FSSAI, nutritional info etc.)
│   {
│     "manufacturer_name": "...",
│     "manufacturer_address": "...",
│     "common_name": "...",
│     "net_quantity": "1kg",
│     "manufacture_date": "01/2026",
│     "fssai_license": "...",
│     "nutritional_info": "...",
│     "additives_info": "..."
│   }
├── published_to_ondc (BOOLEAN, default false)
├── last_published_at (TIMESTAMP, nullable)
├── created_at, updated_at
```

### 4. ONDC Order

```
ondc_order
├── id (UUID, PK)
├── tenant_id (FK → tenant.id)
├── provider_id (FK → ondc_provider.id)
├── ondc_order_id (VARCHAR — Beckn order ID from BAP)
├── transaction_id (VARCHAR — Beckn transaction ID)
├── bap_id (VARCHAR — buyer app identifier)
├── bap_uri (VARCHAR — buyer app callback URL)
├── domain (VARCHAR — e.g., "ONDC:RET12")
├── order_state (ENUM: CREATED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
├── cancellation_reason (VARCHAR, nullable)
├── cancelled_by (VARCHAR, nullable — "BUYER" or "SELLER")
├── billing_name, billing_phone, billing_email
├── billing_address (JSONB)
├── created_at, updated_at
```

### 5. ONDC Order Item

```
ondc_order_item
├── id (UUID, PK)
├── ondc_order_id (FK → ondc_order.id)
├── product_id (FK → product.id)
├── variant_id (FK → product_variant.id, nullable)
├── quantity (INT)
├── unit_price (DECIMAL)
├── total_price (DECIMAL)
├── tax_amount (DECIMAL)
├── discount_amount (DECIMAL, default 0)
├── fulfillment_id (VARCHAR — reference to fulfillment)
├── return_status (ENUM: NONE, REQUESTED, APPROVED, PICKED_UP, REFUNDED, nullable)
├── return_reason (VARCHAR, nullable)
├── created_at
```

### 6. ONDC Fulfillment

```
ondc_fulfillment
├── id (UUID, PK)
├── ondc_order_id (FK → ondc_order.id)
├── fulfillment_type (ENUM: DELIVERY, SELF_PICKUP)
├── fulfillment_state (ENUM: PENDING, PACKED, AGENT_ASSIGNED, PICKED_UP,
│                       OUT_FOR_DELIVERY, ORDER_DELIVERED, CANCELLED,
│                       RTO_INITIATED, RTO_DELIVERED)
├── tracking_url (VARCHAR, nullable)
├── agent_name (VARCHAR, nullable)
├── agent_phone (VARCHAR, nullable)
├── delivery_address (JSONB — {street, city, state, area_code, gps})
├── delivery_gps (VARCHAR — "lat,lng")
├── promised_delivery_start (TIMESTAMP, nullable)
├── promised_delivery_end (TIMESTAMP, nullable)
├── actual_delivery_at (TIMESTAMP, nullable)
├── created_at, updated_at
```

### 7. ONDC Payment

```
ondc_payment
├── id (UUID, PK)
├── ondc_order_id (FK → ondc_order.id)
├── payment_type (ENUM: PRE_PAID, ON_DELIVERY, POST_FULFILLMENT)
├── collected_by (VARCHAR — "BAP" or "BPP")
├── buyer_app_finder_fee_type (VARCHAR — "percent" or "amount")
├── buyer_app_finder_fee_amount (DECIMAL)
├── settlement_basis (VARCHAR — e.g., "delivery")
├── settlement_window (VARCHAR — e.g., "P2D")
├── settlement_amount (DECIMAL, nullable)
├── settlement_status (ENUM: PENDING, SETTLED)
├── payment_uri (VARCHAR, nullable — payment link)
├── transaction_id (VARCHAR, nullable)
├── created_at, updated_at
```

### 8. ONDC API Log (Audit trail for all Beckn messages)

```
ondc_api_log
├── id (UUID, PK)
├── tenant_id (FK → tenant.id)
├── direction (ENUM: INCOMING, OUTGOING)
├── action (VARCHAR — "search", "on_search", "confirm", etc.)
├── transaction_id (VARCHAR)
├── message_id (VARCHAR)
├── bap_id (VARCHAR, nullable)
├── request_body (JSONB)
├── response_body (JSONB, nullable)
├── http_status (INT)
├── error_message (TEXT, nullable)
├── processing_time_ms (INT, nullable)
├── created_at
```

---

## Beckn Schema POJOs

### Core Models

```java
// All Beckn API requests follow this wrapper
public class BecknRequest<T> {
    private BecknContext context;
    private T message;
}

public class BecknContext {
    private String domain;        // "ONDC:RET12"
    private String country;       // "IND"
    private String city;          // "std:080"
    private String action;        // "search", "select", etc.
    private String coreVersion;   // "1.2.0"
    private String bapId;
    private String bapUri;
    private String bppId;
    private String bppUri;
    private String transactionId;
    private String messageId;
    private Instant timestamp;
    private String ttl;           // "PT30S"
}

public class BecknAck {
    private AckStatus status;     // ACK or NACK
    public enum AckStatus { ACK, NACK }
}

public class BecknError {
    private String type;          // "DOMAIN-ERROR", "POLICY-ERROR", etc.
    private String code;
    private String message;
}
```

### Catalog Models

```java
public class BecknCatalog {
    @JsonProperty("bpp/descriptor")
    private Descriptor bppDescriptor;
    @JsonProperty("bpp/providers")
    private List<BecknProvider> providers;
}

public class BecknProvider {
    private String id;
    private Descriptor descriptor;
    private List<Location> locations;
    private List<BecknFulfillment> fulfillments;
    private List<BecknItem> items;
    private List<Category> categories;
    private List<Tag> tags;         // Timing, service area tags
}

public class BecknItem {
    private String id;
    private Descriptor descriptor;   // name, symbol, short_desc, long_desc, images
    private Price price;             // currency, value, maximum_value
    private String categoryId;
    private String fulfillmentId;
    private String locationId;
    private Quantity quantity;
    // ONDC-specific extensions
    @JsonProperty("@ondc/org/returnable")
    private Boolean returnable;
    @JsonProperty("@ondc/org/cancellable")
    private Boolean cancellable;
    @JsonProperty("@ondc/org/return_window")
    private String returnWindow;
    @JsonProperty("@ondc/org/seller_pickup_return")
    private Boolean sellerPickupReturn;
    @JsonProperty("@ondc/org/time_to_ship")
    private String timeToShip;
    @JsonProperty("@ondc/org/available_on_cod")
    private Boolean availableOnCod;
    @JsonProperty("@ondc/org/contact_details_consumer_care")
    private String contactDetailsConsumerCare;
    @JsonProperty("@ondc/org/statutory_reqs_packaged_commodities")
    private Map<String, String> statutoryPackagedCommodities;
    @JsonProperty("@ondc/org/statutory_reqs_prepackaged_food")
    private Map<String, String> statutoryPrepackagedFood;
    private List<Tag> tags;
}

public class Descriptor {
    private String name;
    private String symbol;      // image URL
    private String shortDesc;
    private String longDesc;
    private List<String> images;
}

public class Price {
    private String currency;     // "INR"
    private String value;        // selling price as STRING
    private String maximumValue; // MRP as STRING
}

public class Quantity {
    private Unitized unitized;   // measure: {unit, value}
    private Available available; // count: "99" or "0"
    private Maximum maximum;     // max orderable quantity
}
```

### Order Models

```java
public class BecknOrder {
    private String id;
    private String state;                // Created, Accepted, In-progress, Completed, Cancelled
    private BecknProvider provider;
    private List<BecknItem> items;
    private Billing billing;
    private BecknFulfillment fulfillment;
    private Quote quote;
    private Payment payment;
    private String createdAt;
    private String updatedAt;
    private Cancellation cancellation;
}

public class Quote {
    private Price price;                 // total order price
    private List<QuoteBreakup> breakup; // itemized breakup
    private String ttl;                  // quote validity
}

public class QuoteBreakup {
    @JsonProperty("@ondc/org/item_id")
    private String itemId;
    @JsonProperty("@ondc/org/title_type")
    private String titleType;            // "item", "delivery", "tax", "discount"
    private String title;
    private Price price;
    private ItemQuantity itemQuantity;
}

public class Billing {
    private String name;
    private String phone;
    private String email;
    private Address address;
    private String createdAt;
    private String updatedAt;
}

public class Payment {
    private String type;                 // "PRE-FULFILLMENT", "ON-FULFILLMENT", "POST-FULFILLMENT"
    private String collectedBy;          // "BAP" or "BPP"
    @JsonProperty("@ondc/org/buyer_app_finder_fee_type")
    private String buyerAppFinderFeeType;
    @JsonProperty("@ondc/org/buyer_app_finder_fee_amount")
    private String buyerAppFinderFeeAmount;
    @JsonProperty("@ondc/org/settlement_basis")
    private String settlementBasis;
    @JsonProperty("@ondc/org/settlement_window")
    private String settlementWindow;
}
```

---

## REST API Design

### Beckn Protocol APIs (BPP Endpoints — called by BAPs/Gateway)

These are the **core protocol endpoints**. Each receives a Beckn request, returns ACK, processes async, then POSTs callback to BAP.

```
POST   /ondc/search          # Receive search intent → async on_search callback
POST   /ondc/select          # Receive item selection → async on_select (quote)
POST   /ondc/init            # Receive billing/shipping → async on_init (payment terms)
POST   /ondc/confirm         # Receive confirmed order → async on_confirm
POST   /ondc/status          # Receive status request → async on_status
POST   /ondc/track           # Receive track request → async on_track
POST   /ondc/cancel          # Receive cancellation → async on_cancel
POST   /ondc/update          # Receive order update → async on_update
POST   /ondc/rating          # Receive rating → async on_rating
POST   /ondc/support         # Receive support request → async on_support
```

### ONDC Registry APIs (called during onboarding)

```
POST   /ondc/on_subscribe    # Handle ONDC encryption challenge during registration
```

### Seller Dashboard APIs (Internal — for QuickCatalog UI)

#### Provider Management
```
GET    /api/ondc/providers                    # List ONDC providers (store locations)
POST   /api/ondc/providers                    # Create provider
PUT    /api/ondc/providers/{id}               # Update provider
DELETE /api/ondc/providers/{id}               # Delete provider
```

#### Product ONDC Config
```
GET    /api/ondc/products/{productId}/config  # Get ONDC config for a product
PUT    /api/ondc/products/{productId}/config  # Set/update ONDC config
POST   /api/ondc/products/{productId}/publish # Publish product to ONDC
POST   /api/ondc/products/{productId}/unpublish # Remove from ONDC
POST   /api/ondc/products/bulk-publish        # Bulk publish to ONDC
GET    /api/ondc/products/published           # List all ONDC-published products
```

#### ONDC Order Management
```
GET    /api/ondc/orders                       # List ONDC orders (paginated, filterable)
GET    /api/ondc/orders/{id}                  # Order detail with items + fulfillment
PATCH  /api/ondc/orders/{id}/accept           # Accept order → triggers on_confirm update
PATCH  /api/ondc/orders/{id}/reject           # Reject order → triggers on_cancel
PATCH  /api/ondc/orders/{id}/pack             # Mark as packed → fulfillment state update
PATCH  /api/ondc/orders/{id}/ship             # Mark as shipped + tracking URL
PATCH  /api/ondc/orders/{id}/deliver          # Mark as delivered
PATCH  /api/ondc/orders/{id}/cancel           # Seller cancellation
POST   /api/ondc/orders/{id}/status-update    # Push status update to BAP
```

#### Return/Refund
```
GET    /api/ondc/returns                      # List return requests
PATCH  /api/ondc/returns/{id}/approve         # Approve return
PATCH  /api/ondc/returns/{id}/reject          # Reject return
PATCH  /api/ondc/returns/{id}/refund          # Process refund
```

#### ONDC Subscriber / Registration
```
GET    /api/ondc/subscriber                   # Get subscriber config
POST   /api/ondc/subscriber                   # Create/update subscriber (keys, URLs)
POST   /api/ondc/subscriber/generate-keys     # Generate Ed25519 + X25519 key pairs
POST   /api/ondc/subscriber/register          # Initiate /subscribe with ONDC registry
GET    /api/ondc/subscriber/status            # Check registration status
```

#### Dashboard & Logs
```
GET    /api/ondc/dashboard                    # ONDC-specific stats (orders, revenue, etc.)
GET    /api/ondc/logs                         # API logs (paginated, filterable by action)
GET    /api/ondc/logs/{id}                    # Full log detail with request/response body
```

---

## Catalog Mapping: QuickCatalog Product → Beckn Item

### Field Mapping Table

| QuickCatalog Product | Beckn Item Field | Notes |
|---------------------|-----------------|-------|
| `id` | `id` | Use product UUID |
| `name` | `descriptor.name` | Direct |
| Primary image URL | `descriptor.symbol` | First image |
| `short_description` | `descriptor.short_desc` | Direct |
| `long_description` | `descriptor.long_desc` | Strip HTML |
| Image URLs | `descriptor.images` | All product images |
| `selling_price` | `price.value` | As string |
| `mrp` | `price.maximum_value` | As string |
| `category` → ONDC mapping | `category_id` | Via `ondc_product_config.ondc_category_id` |
| `current_stock` > 0 ? "99" : "0" | `quantity.available.count` | ONDC uses 99 for in-stock |
| `unit` | `quantity.unitized.measure` | Map UnitType → ONDC unit |
| `weight_grams` | Item tags | As "weight" tag |
| `gst_rate` | Quote breakup | Tax line item |
| Config: `time_to_ship` | `@ondc/org/time_to_ship` | From `ondc_product_config` |
| Config: `returnable` | `@ondc/org/returnable` | From config or provider default |
| Config: `cancellable` | `@ondc/org/cancellable` | From config or provider default |
| Config: `return_window` | `@ondc/org/return_window` | From config or provider default |
| Config: `statutory_info` | `@ondc/org/statutory_reqs_*` | Category-specific |
| Provider: `contact_email` | `@ondc/org/contact_details_consumer_care` | "Name,email,phone" format |

### Unit Mapping

| QuickCatalog UnitType | ONDC Unit |
|----------------------|-----------|
| PCS | "unit" |
| KG | "kilogram" |
| LTR | "litre" |
| MTR | "metre" |
| BOX | "unit" |
| SET | "unit" |
| PAIR | "unit" |
| DOZEN | "dozen" |

### Category Mapping (QuickCatalog → ONDC)

The seller maps each product to an ONDC domain+category via the `ondc_product_config` entity. The UI provides a dropdown of ONDC categories grouped by domain.

Example mappings:
- Fashion > Men > Kurtas → `ONDC:RET12` / `Kurta`
- Food > Spices → `ONDC:RET10` / `Masala & Seasoning`
- Electronics > Mobile Accessories → `ONDC:RET14` / `Mobile Phone Accessories`

---

## Security Layer

### Ed25519 Signing (Every API Call)

```
Flow for OUTGOING requests (on_search, on_select, etc.):
1. Serialize request body to JSON
2. Compute BLAKE-512 hash of body → base64 encode → "BLAKE-512={hash}"
3. Build signing string:
   "(created): {unix_timestamp}\n(expires): {unix_timestamp + 300}\ndigest: BLAKE-512={hash}"
4. Sign with Ed25519 private key → base64 encode
5. Set Authorization header:
   Signature keyId="{subscriber_id}|{unique_key_id}|ed25519",
   algorithm="ed25519",
   created="{ts}",expires="{ts+300}",
   headers="(created) (expires) digest",
   signature="{base64_sig}"

Flow for INCOMING requests (search, select, etc.):
1. Parse Authorization header
2. Extract keyId → split to get subscriber_id and key_id
3. Lookup sender's public key from ONDC registry (/vlookup)
4. Rebuild signing string from (created), (expires), digest
5. Verify Ed25519 signature using sender's public key
6. Reject if expired or invalid
```

### X25519 Encryption (Registry Challenge)

```
Flow for /on_subscribe:
1. ONDC sends encrypted challenge_string
2. Derive shared secret: X25519(our_private_key, ondc_public_key)
3. Use shared secret as AES key
4. Decrypt challenge_string using AES
5. Return { "answer": decrypted_plaintext }
```

### Key Java Dependencies

```xml
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk18on</artifactId>
    <version>1.78</version>
</dependency>
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcpkix-jdk18on</artifactId>
    <version>1.78</version>
</dependency>
```

---

## Order Lifecycle

### Happy Path Flow

```
1. SEARCH (Discovery)
   BAP → /ondc/search (intent: "cotton kurta", city: "std:080")
   BPP → ACK
   BPP → POST on_search to BAP (catalog with matching items)

2. SELECT (Quote)
   BAP → /ondc/select (selected items + quantities)
   BPP → ACK
   BPP → Checks stock, calculates price breakup (item + tax + delivery)
   BPP → POST on_select to BAP (quote with breakup + TTL)

3. INIT (Order Initialization)
   BAP → /ondc/init (billing info, delivery address)
   BPP → ACK
   BPP → Validates delivery serviceability, confirms payment terms
   BPP → POST on_init to BAP (payment details, cancellation policy)

4. CONFIRM (Place Order)
   BAP → /ondc/confirm (payment proof, final order)
   BPP → ACK
   BPP → Creates ondc_order (state: CREATED)
   BPP → Reserves stock (product.current_stock -= qty)
   BPP → POST on_confirm to BAP (confirmed order with ID)

5. FULFILLMENT (Seller processes order)
   Seller accepts → order_state: ACCEPTED
   Seller packs → fulfillment_state: PACKED
   Agent assigned → AGENT_ASSIGNED
   Picked up → PICKED_UP
   Out for delivery → OUT_FOR_DELIVERY
   Delivered → ORDER_DELIVERED, order_state: COMPLETED

   Each state change → BPP unsolicited POST /on_status to BAP

6. STATUS (BAP checks status)
   BAP → /ondc/status (order_id)
   BPP → ACK
   BPP → POST on_status to BAP (current order + fulfillment state)
```

### Cancellation Flow

```
BUYER-INITIATED:
  BAP → /ondc/cancel (order_id, reason_code)
  BPP → Checks cancellation policy (is_cancellable, time window)
  BPP → If allowed: cancel order, restore stock, calculate refund
  BPP → POST on_cancel to BAP (cancelled order, refund details)

SELLER-INITIATED:
  Seller clicks "Cancel" in dashboard
  BPP → POST /on_status to BAP with order_state: CANCELLED
  Reason codes: "001" (item out of stock), "002" (pricing error), etc.
```

### Return Flow

```
1. BAP → /ondc/update (type: "return", items, reason)
2. BPP → ACK
3. Seller reviews return in dashboard
4. Seller approves → BPP → POST /on_update (return approved, pickup scheduled)
5. Item picked up → state updates via /on_update
6. Refund processed → BPP → POST /on_update (refund status)
```

### ONDC Cancellation Reason Codes

| Code | Reason |
|------|--------|
| 001 | Price of item(s) has changed |
| 002 | Item out of stock |
| 003 | Store closed |
| 004 | Seller not able to fulfill |
| 005 | Address not serviceable |
| 006 | Buyer not available |

---

## Project Structure (New Code)

```
backend/src/main/java/com/quickcatalog/
├── ondc/
│   ├── config/
│   │   ├── OndcProperties.java              # ONDC config from application.yml
│   │   └── OndcAsyncConfig.java             # Async executor for callbacks
│   │
│   ├── crypto/
│   │   ├── Ed25519Service.java              # Sign & verify (BLAKE-512 + Ed25519)
│   │   ├── X25519Service.java               # Key exchange + AES decrypt
│   │   ├── KeyGenerationService.java        # Generate Ed25519 + X25519 key pairs
│   │   └── OndcAuthFilter.java              # Servlet filter: verify incoming, sign outgoing
│   │
│   ├── registry/
│   │   ├── RegistryService.java             # /subscribe, /lookup, /vlookup calls
│   │   ├── OnSubscribeController.java       # POST /ondc/on_subscribe (challenge handler)
│   │   └── RegistryLookupCache.java         # Cache public keys (TTL-based)
│   │
│   ├── beckn/
│   │   ├── model/                           # Beckn protocol POJOs
│   │   │   ├── BecknRequest.java
│   │   │   ├── BecknResponse.java
│   │   │   ├── BecknContext.java
│   │   │   ├── BecknAck.java
│   │   │   ├── BecknError.java
│   │   │   ├── Descriptor.java
│   │   │   ├── Price.java
│   │   │   ├── Quantity.java
│   │   │   ├── Location.java
│   │   │   ├── Address.java
│   │   │   ├── Tag.java
│   │   │   ├── BecknCatalog.java
│   │   │   ├── BecknProvider.java
│   │   │   ├── BecknItem.java
│   │   │   ├── BecknOrder.java
│   │   │   ├── BecknFulfillment.java
│   │   │   ├── Quote.java
│   │   │   ├── QuoteBreakup.java
│   │   │   ├── Billing.java
│   │   │   └── Payment.java
│   │   │
│   │   ├── controller/                      # BPP protocol endpoints
│   │   │   ├── SearchController.java        # POST /ondc/search
│   │   │   ├── SelectController.java        # POST /ondc/select
│   │   │   ├── InitController.java          # POST /ondc/init
│   │   │   ├── ConfirmController.java       # POST /ondc/confirm
│   │   │   ├── StatusController.java        # POST /ondc/status
│   │   │   ├── TrackController.java         # POST /ondc/track
│   │   │   ├── CancelController.java        # POST /ondc/cancel
│   │   │   ├── UpdateController.java        # POST /ondc/update
│   │   │   ├── RatingController.java        # POST /ondc/rating
│   │   │   └── SupportController.java       # POST /ondc/support
│   │   │
│   │   └── service/
│   │       ├── CatalogMappingService.java   # Product → BecknItem conversion
│   │       ├── QuoteService.java            # Build price breakup (item + tax + delivery)
│   │       ├── OndcOrderService.java        # Order create, accept, fulfill, cancel
│   │       ├── FulfillmentService.java      # Fulfillment state machine
│   │       ├── ReturnService.java           # Return/refund processing
│   │       ├── CallbackService.java         # POST on_* to BAP URI (with signing)
│   │       └── OndcApiLogService.java       # Log all Beckn messages
│   │
│   ├── seller/                              # Internal dashboard APIs
│   │   ├── controller/
│   │   │   ├── OndcProviderController.java  # /api/ondc/providers
│   │   │   ├── OndcProductConfigController.java  # /api/ondc/products/{id}/config
│   │   │   ├── OndcOrderController.java     # /api/ondc/orders
│   │   │   ├── OndcReturnController.java    # /api/ondc/returns
│   │   │   ├── OndcSubscriberController.java # /api/ondc/subscriber
│   │   │   └── OndcDashboardController.java # /api/ondc/dashboard
│   │   └── dto/
│   │       ├── ProviderRequest.java / ProviderResponse.java
│   │       ├── ProductConfigRequest.java / ProductConfigResponse.java
│   │       ├── OndcOrderResponse.java / OndcOrderListResponse.java
│   │       ├── ReturnResponse.java
│   │       ├── SubscriberRequest.java / SubscriberResponse.java
│   │       └── OndcDashboardResponse.java
│   │
│   ├── entity/
│   │   ├── OndcProvider.java
│   │   ├── OndcSubscriber.java
│   │   ├── OndcProductConfig.java
│   │   ├── OndcOrder.java
│   │   ├── OndcOrderItem.java
│   │   ├── OndcFulfillment.java
│   │   ├── OndcPayment.java
│   │   ├── OndcApiLog.java
│   │   └── enums/
│   │       ├── OndcEnvironment.java
│   │       ├── RegistrationStatus.java
│   │       ├── OndcOrderState.java
│   │       ├── FulfillmentState.java
│   │       ├── FulfillmentType.java
│   │       ├── PaymentType.java
│   │       ├── SettlementStatus.java
│   │       ├── ReturnStatus.java
│   │       └── ApiDirection.java
│   │
│   └── repository/
│       ├── OndcProviderRepository.java
│       ├── OndcSubscriberRepository.java
│       ├── OndcProductConfigRepository.java
│       ├── OndcOrderRepository.java
│       ├── OndcOrderItemRepository.java
│       ├── OndcFulfillmentRepository.java
│       ├── OndcPaymentRepository.java
│       └── OndcApiLogRepository.java
```

### Frontend (New Angular Features)

```
frontend/src/app/features/ondc/
├── ondc.routes.ts
├── ondc-setup/
│   ├── provider-form/              # Store/location setup for ONDC
│   ├── subscriber-setup/           # Keys, registration, environment toggle
│   └── registration-status/        # Registry status + test connection
├── ondc-products/
│   ├── ondc-config-form/           # Per-product ONDC fields (time_to_ship, statutory info)
│   ├── ondc-category-mapper/       # Map QuickCatalog category → ONDC category
│   └── ondc-publish-manager/       # Bulk publish/unpublish with status
├── ondc-orders/
│   ├── order-list/                 # ONDC orders (with state filters)
│   ├── order-detail/               # Full order view + action buttons
│   ├── order-timeline/             # Visual fulfillment state timeline
│   └── order-actions/              # Accept/reject/pack/ship/deliver buttons
├── ondc-returns/
│   ├── return-list/                # Return requests
│   └── return-detail/              # Approve/reject + refund
└── ondc-dashboard/
    └── ondc-stats/                 # ONDC orders, revenue, top products
```

---

## Configuration (application.yml)

```yaml
ondc:
  enabled: true
  environment: STAGING          # STAGING | PRE_PROD | PRODUCTION
  registry:
    staging:
      subscribe-url: https://staging.registry.ondc.org/subscribe
      lookup-url: https://staging.registry.ondc.org/v2.0/lookup
      encryption-public-key: MCowBQYDK2VuAyEAduMuZgmtpjdCuxv+Nc49K0cB6tL/Dj3HZetvVN7ZekM=
    pre-prod:
      subscribe-url: https://preprod.registry.ondc.org/ondc/subscribe
      lookup-url: https://preprod.registry.ondc.org/v2.0/lookup
      encryption-public-key: MCowBQYDK2VuAyEAa9Wbpvd9SsrpOZFcynyt/TO3x0Yrqyys4NUGIvyxX2Q=
    production:
      subscribe-url: https://prod.registry.ondc.org/subscribe
      lookup-url: https://prod.registry.ondc.org/v2.0/lookup
      encryption-public-key: MCowBQYDK2VuAyEAvVEyZY91O2yV8w8/CAwVDAnqIZDJJUPdLUUKwLo3K0M=
  callback:
    timeout-seconds: 30          # Max time to respond to BAP
  keys:
    # Keys are stored in DB (ondc_subscriber table), not in config
    # This section is for fallback/override only
  rate-limit:
    search-per-minute: 100
    other-per-minute: 60
```

---

## Phased Build Plan

### Phase 1 — Crypto + Registry + Catalog Discovery (Foundation)

**Goal**: Products appear on ONDC buyer apps via `/search` → `/on_search`.

1. DB migration: Create all ONDC tables (`ondc_subscriber`, `ondc_provider`, `ondc_product_config`, `ondc_api_log`)
2. `Ed25519Service` — signing and verification using BouncyCastle
3. `X25519Service` — key exchange + AES decryption for registry challenge
4. `KeyGenerationService` — generate Ed25519 + X25519 key pairs
5. `OndcAuthFilter` — servlet filter to verify incoming and sign outgoing requests
6. `RegistryService` — `/subscribe`, `/lookup`, `/vlookup` calls
7. `OnSubscribeController` — handle ONDC challenge at `/ondc/on_subscribe`
8. `OndcProperties` — load config from application.yml
9. Beckn model POJOs — `BecknContext`, `BecknRequest`, `BecknAck`, `Descriptor`, `Price`, `Quantity`, `BecknItem`, `BecknCatalog`, `BecknProvider`
10. `CatalogMappingService` — convert QuickCatalog Product → BecknItem
11. `CallbackService` — POST signed callbacks to BAP URI
12. `SearchController` (BPP) — receive `/ondc/search`, ACK, async build catalog, POST `/on_search`
13. `OndcApiLogService` — log all incoming/outgoing Beckn messages
14. Seller dashboard APIs: `OndcSubscriberController`, `OndcProviderController`
15. Frontend: Subscriber setup page (generate keys, register with ONDC staging)
16. Frontend: Provider form (store location, timing, contact info)
17. Frontend: Product ONDC config form (time_to_ship, returnable, statutory info)
18. Test against ONDC staging reference buyer app

### Phase 2 — Select + Init + Confirm (Order Placement)

**Goal**: Customers can select items, get quotes, and place orders.

19. DB migration: Create `ondc_order`, `ondc_order_item`, `ondc_fulfillment`, `ondc_payment` tables
20. `QuoteService` — build price breakup (item price + delivery + tax - discount)
21. `SelectController` — receive `/ondc/select`, check stock, return quote via `/on_select`
22. `InitController` — receive `/ondc/init`, validate serviceability, return payment terms via `/on_init`
23. `OndcOrderService` — create order, reserve stock
24. `ConfirmController` — receive `/ondc/confirm`, create order, POST `/on_confirm`
25. Seller dashboard: Order list page (ONDC orders with state filters)
26. Seller dashboard: Order detail page (items, billing, delivery address)
27. Integration test: Full search → select → init → confirm flow against ONDC staging

### Phase 3 — Fulfillment + Status (Order Processing)

**Goal**: Sellers can accept, pack, ship, and deliver orders.

28. `FulfillmentService` — state machine (PENDING → PACKED → PICKED_UP → DELIVERED)
29. `StatusController` — receive `/ondc/status`, return current state via `/on_status`
30. `TrackController` — return tracking URL via `/on_track`
31. Unsolicited status updates — push `on_status` to BAP on each state change
32. Order action APIs: accept, pack, ship, deliver
33. Seller dashboard: Order action buttons (Accept/Pack/Ship/Deliver)
34. Seller dashboard: Order timeline (visual state progression)
35. Stock management — decrement on confirm, restore on cancel

### Phase 4 — Cancel + Return + Rating (Post-Order)

**Goal**: Handle cancellations, returns, refunds, and ratings.

36. `CancelController` — buyer-initiated cancellation via `/on_cancel`
37. Seller-initiated cancellation — push cancelled state to BAP
38. Cancellation policy enforcement (time window, cancellable flag)
39. `UpdateController` — handle return requests via `/on_update`
40. `ReturnService` — approve/reject returns, track return pickup, process refund
41. `RatingController` — acknowledge ratings via `/on_rating`
42. `SupportController` — return support details via `/on_support`
43. Seller dashboard: Returns list + approve/reject UI
44. Seller dashboard: Cancellation handling

### Phase 5 — Multi-Category + Polish (Production Readiness)

**Goal**: Support all retail categories, pass ONDC compliance, go live.

45. Category-specific statutory fields — different forms for RET10 (grocery), RET11 (F&B), RET12 (fashion), etc.
46. FSSAI license validation (RET10/RET11)
47. ONDC Pramaan compliance testing — run automated test suite
48. Log validation — pass ONDC log validation utility checks
49. Delivery serviceability checks (PIN code / GPS radius)
50. Settlement tracking — buyer app finder fee, payment reconciliation
51. ONDC dashboard — orders, revenue, top items, fulfillment SLA metrics
52. Pre-prod registration + demo to ONDC team
53. Production registration + go-live
54. Monitoring: alerts on failed callbacks, slow responses, order SLA breaches

---

## Testing Strategy

### Unit Tests
- `Ed25519ServiceTest` — sign/verify round-trip, invalid signature rejection
- `X25519ServiceTest` — decrypt known ONDC challenge
- `CatalogMappingServiceTest` — Product → BecknItem conversion with all fields
- `QuoteServiceTest` — breakup calculation (item + tax + delivery)
- `FulfillmentServiceTest` — state machine transitions (valid + invalid)

### Integration Tests
- Full BPP flow: search → on_search → select → on_select → init → on_init → confirm → on_confirm
- Auth filter: reject unsigned requests, accept valid signatures
- Registry: subscribe + on_subscribe challenge

### ONDC Compliance Tests
- Use ONDC Pramaan tool (`https://pramaan.ondc.org/`)
- Use ONDC Log Validation Utility (`https://github.com/ONDC-Official/log-validation-utility`)
- Use ONDC Mock Server (`https://github.com/ONDC-Official/mock-server-utility`) for BAP simulation

### Test Environments
| Environment | Use |
|-------------|-----|
| Local | Unit tests, mock BAP |
| ONDC Staging | Integration testing with reference buyer app |
| ONDC Pre-Prod | Compliance validation, demo to ONDC |
| ONDC Production | Live transactions |

---

## Key Technical Decisions

1. **ONDC module lives inside QuickCatalog** (not a separate microservice) — keeps deployment simple for MSMEs, shares the same DB and auth.

2. **Async processing via `@Async` + Spring's `TaskExecutor`** — all BPP endpoints return ACK immediately, process in background thread, POST callback.

3. **Beckn protocol endpoints are NOT behind JWT auth** — they use Ed25519 signature verification via `OndcAuthFilter` instead. Internal seller dashboard APIs still use JWT.

4. **Catalog is built on-demand** from QuickCatalog products — no separate ONDC catalog copy. `CatalogMappingService` queries products + `ondc_product_config` and converts to Beckn format on each `/search`.

5. **ONDC orders are separate from any future internal order system** — `ondc_order` table tracks Beckn-specific fields (transaction_id, bap_id, fulfillment states). Can bridge to QuickShipment later via events.

6. **Keys stored in DB, encrypted at rest** — allows multi-tenant ONDC registration (each tenant has their own subscriber ID and keys).

7. **All Beckn messages logged** — `ondc_api_log` provides full audit trail for ONDC compliance and debugging.

---

## References

- ONDC Protocol Specs: https://github.com/ONDC-Official/ONDC-Protocol-Specs
- ONDC Retail Specs: https://github.com/ONDC-Official/ONDC-RET-Specifications
- Beckn Protocol: https://developers.becknprotocol.io/docs/introduction/beckn-protocol-specification/
- ONDC Developer Docs: https://github.com/ONDC-Official/developer-docs
- ONDC Signing/Verification: https://github.com/ONDC-Official/developer-docs/blob/main/registry/signing-verification.md
- ONDC Seller App SDK (reference): https://github.com/ONDC-Official/seller-app-sdk
- ONDC Pramaan (test bench): https://pramaan.ondc.org/
- ONDC Log Validation: https://github.com/ONDC-Official/log-validation-utility
- ONDC Mock Server: https://github.com/ONDC-Official/mock-server-utility
