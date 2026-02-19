-- ============================================================================
-- QuickCatalog - ONDC Integration Database Migration
-- ============================================================================
-- Run this AFTER init.sql. Adds all ONDC-related tables and enums.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ONDC ENUM TYPES
-- ============================================================================

CREATE TYPE ondc_environment AS ENUM ('STAGING', 'PRE_PROD', 'PRODUCTION');

CREATE TYPE registration_status AS ENUM ('PENDING', 'INITIATED', 'SUBSCRIBED', 'FAILED');

CREATE TYPE ondc_order_state AS ENUM ('CREATED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TYPE fulfillment_state AS ENUM (
    'PENDING', 'PACKED', 'AGENT_ASSIGNED', 'PICKED_UP',
    'OUT_FOR_DELIVERY', 'ORDER_DELIVERED', 'CANCELLED',
    'RTO_INITIATED', 'RTO_DELIVERED'
);

CREATE TYPE fulfillment_type AS ENUM ('DELIVERY', 'SELF_PICKUP');

CREATE TYPE payment_type AS ENUM ('PRE_PAID', 'ON_DELIVERY', 'POST_FULFILLMENT');

CREATE TYPE settlement_status AS ENUM ('PENDING', 'SETTLED');

CREATE TYPE return_status AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'PICKED_UP', 'REFUNDED');

CREATE TYPE api_direction AS ENUM ('INCOMING', 'OUTGOING');

-- ============================================================================
-- 2. ONDC SUBSCRIBER TABLE (Network Registration)
-- ============================================================================

CREATE TABLE ondc_subscriber (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL REFERENCES tenant(id),
    subscriber_id           VARCHAR(500) NOT NULL,
    subscriber_url          VARCHAR(500) NOT NULL,
    environment             ondc_environment NOT NULL DEFAULT 'STAGING',
    signing_public_key      TEXT,
    signing_private_key     TEXT,
    encryption_public_key   TEXT,
    encryption_private_key  TEXT,
    unique_key_id           VARCHAR(255),
    domain                  VARCHAR(255),
    city_codes              TEXT[] DEFAULT '{}',
    registration_status     registration_status DEFAULT 'PENDING',
    last_subscribe_at       TIMESTAMP,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ondc_subscriber_tenant_id ON ondc_subscriber(tenant_id);
CREATE UNIQUE INDEX idx_ondc_subscriber_tenant_env ON ondc_subscriber(tenant_id, environment);

CREATE TRIGGER trg_ondc_subscriber_updated_at
    BEFORE UPDATE ON ondc_subscriber FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. ONDC PROVIDER TABLE (Store/Location on ONDC)
-- ============================================================================

CREATE TABLE ondc_provider (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL REFERENCES tenant(id),
    provider_id             VARCHAR(255) NOT NULL,
    name                    VARCHAR(255) NOT NULL,
    short_desc              VARCHAR(500),
    long_desc               TEXT,
    logo_url                VARCHAR(500),
    gps_coordinates         VARCHAR(50),
    address_street          VARCHAR(500),
    address_city            VARCHAR(100),
    address_state           VARCHAR(100),
    address_area_code       VARCHAR(10),
    address_country         VARCHAR(10) DEFAULT 'IND',
    contact_phone           VARCHAR(15),
    contact_email           VARCHAR(255),
    support_phone           VARCHAR(15),
    support_email           VARCHAR(255),
    support_url             VARCHAR(500),
    fssai_license_no        VARCHAR(20),
    store_timing_start      TIME,
    store_timing_end        TIME,
    store_days              VARCHAR(20) DEFAULT '1,2,3,4,5,6,7',
    holidays                JSONB DEFAULT '[]'::jsonb,
    default_time_to_ship    VARCHAR(20) DEFAULT 'PT24H',
    default_returnable      BOOLEAN DEFAULT TRUE,
    default_cancellable     BOOLEAN DEFAULT TRUE,
    default_return_window   VARCHAR(20) DEFAULT 'P7D',
    default_cod_available   BOOLEAN DEFAULT FALSE,
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ondc_provider_tenant_id ON ondc_provider(tenant_id);

CREATE TRIGGER trg_ondc_provider_updated_at
    BEFORE UPDATE ON ondc_provider FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ONDC PRODUCT CONFIG TABLE (Per-product ONDC-specific fields)
-- ============================================================================

CREATE TABLE ondc_product_config (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id              UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    tenant_id               UUID NOT NULL REFERENCES tenant(id),
    ondc_domain             VARCHAR(20) NOT NULL,
    ondc_category_id        VARCHAR(100),
    time_to_ship            VARCHAR(20),
    returnable              BOOLEAN,
    cancellable             BOOLEAN,
    return_window           VARCHAR(20),
    seller_pickup_return    BOOLEAN DEFAULT TRUE,
    cod_available           BOOLEAN,
    max_order_quantity      INT,
    country_of_origin       VARCHAR(10) DEFAULT 'IND',
    is_veg                  BOOLEAN,
    is_non_veg              BOOLEAN,
    is_egg                  BOOLEAN,
    statutory_info          JSONB DEFAULT '{}'::jsonb,
    published_to_ondc       BOOLEAN DEFAULT FALSE,
    last_published_at       TIMESTAMP,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ondc_product_config_product ON ondc_product_config(product_id);
CREATE INDEX idx_ondc_product_config_tenant ON ondc_product_config(tenant_id);
CREATE INDEX idx_ondc_product_config_published ON ondc_product_config(tenant_id, published_to_ondc);

CREATE TRIGGER trg_ondc_product_config_updated_at
    BEFORE UPDATE ON ondc_product_config FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ONDC ORDER TABLE
-- ============================================================================

CREATE TABLE ondc_order (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL REFERENCES tenant(id),
    provider_id             UUID NOT NULL REFERENCES ondc_provider(id),
    ondc_order_id           VARCHAR(255) NOT NULL,
    transaction_id          VARCHAR(255) NOT NULL,
    bap_id                  VARCHAR(500) NOT NULL,
    bap_uri                 VARCHAR(500) NOT NULL,
    domain                  VARCHAR(20),
    order_state             ondc_order_state DEFAULT 'CREATED',
    cancellation_reason     VARCHAR(500),
    cancelled_by            VARCHAR(20),
    billing_name            VARCHAR(255),
    billing_phone           VARCHAR(15),
    billing_email           VARCHAR(255),
    billing_address         JSONB DEFAULT '{}'::jsonb,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ondc_order_tenant_id ON ondc_order(tenant_id);
CREATE INDEX idx_ondc_order_transaction ON ondc_order(transaction_id);
CREATE INDEX idx_ondc_order_ondc_id ON ondc_order(ondc_order_id);
CREATE INDEX idx_ondc_order_state ON ondc_order(tenant_id, order_state);

CREATE TRIGGER trg_ondc_order_updated_at
    BEFORE UPDATE ON ondc_order FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. ONDC ORDER ITEM TABLE
-- ============================================================================

CREATE TABLE ondc_order_item (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ondc_order_id           UUID NOT NULL REFERENCES ondc_order(id) ON DELETE CASCADE,
    product_id              UUID REFERENCES product(id),
    variant_id              UUID REFERENCES product_variant(id),
    quantity                INT NOT NULL,
    unit_price              DECIMAL(12,2) NOT NULL,
    total_price             DECIMAL(12,2) NOT NULL,
    tax_amount              DECIMAL(12,2) DEFAULT 0,
    discount_amount         DECIMAL(12,2) DEFAULT 0,
    fulfillment_id          VARCHAR(255),
    return_status           return_status DEFAULT 'NONE',
    return_reason           VARCHAR(500),
    created_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ondc_order_item_order ON ondc_order_item(ondc_order_id);

-- ============================================================================
-- 7. ONDC FULFILLMENT TABLE
-- ============================================================================

CREATE TABLE ondc_fulfillment (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ondc_order_id               UUID NOT NULL REFERENCES ondc_order(id) ON DELETE CASCADE,
    fulfillment_type            fulfillment_type DEFAULT 'DELIVERY',
    fulfillment_state           fulfillment_state DEFAULT 'PENDING',
    tracking_url                VARCHAR(500),
    agent_name                  VARCHAR(255),
    agent_phone                 VARCHAR(15),
    delivery_address            JSONB DEFAULT '{}'::jsonb,
    delivery_gps                VARCHAR(50),
    promised_delivery_start     TIMESTAMP,
    promised_delivery_end       TIMESTAMP,
    actual_delivery_at          TIMESTAMP,
    created_at                  TIMESTAMP DEFAULT NOW(),
    updated_at                  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ondc_fulfillment_order ON ondc_fulfillment(ondc_order_id);

CREATE TRIGGER trg_ondc_fulfillment_updated_at
    BEFORE UPDATE ON ondc_fulfillment FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. ONDC PAYMENT TABLE
-- ============================================================================

CREATE TABLE ondc_payment (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ondc_order_id                   UUID NOT NULL REFERENCES ondc_order(id) ON DELETE CASCADE,
    payment_type                    payment_type DEFAULT 'PRE_PAID',
    collected_by                    VARCHAR(10),
    buyer_app_finder_fee_type       VARCHAR(20),
    buyer_app_finder_fee_amount     DECIMAL(12,2),
    settlement_basis                VARCHAR(50),
    settlement_window               VARCHAR(20),
    settlement_amount               DECIMAL(12,2),
    settlement_status               settlement_status DEFAULT 'PENDING',
    payment_uri                     VARCHAR(500),
    transaction_id                  VARCHAR(255),
    created_at                      TIMESTAMP DEFAULT NOW(),
    updated_at                      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ondc_payment_order ON ondc_payment(ondc_order_id);

CREATE TRIGGER trg_ondc_payment_updated_at
    BEFORE UPDATE ON ondc_payment FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. ONDC API LOG TABLE (Audit trail)
-- ============================================================================

CREATE TABLE ondc_api_log (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID REFERENCES tenant(id),
    direction               api_direction NOT NULL,
    action                  VARCHAR(50) NOT NULL,
    transaction_id          VARCHAR(255),
    message_id              VARCHAR(255),
    bap_id                  VARCHAR(500),
    request_body            JSONB,
    response_body           JSONB,
    http_status             INT,
    error_message           TEXT,
    processing_time_ms      INT,
    created_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ondc_api_log_tenant ON ondc_api_log(tenant_id);
CREATE INDEX idx_ondc_api_log_action ON ondc_api_log(action);
CREATE INDEX idx_ondc_api_log_transaction ON ondc_api_log(transaction_id);
CREATE INDEX idx_ondc_api_log_created ON ondc_api_log(created_at DESC);

-- ============================================================================
-- END OF ONDC MIGRATION
-- ============================================================================

COMMIT;
