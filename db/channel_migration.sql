-- ============================================================================
-- QuickCatalog - Channel & Publishing Database Migration
-- ============================================================================
-- Run this AFTER init.sql and ondc_migration.sql.
-- Adds multi-channel publishing tables for Phase 3.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CHANNEL ENUM TYPES
-- ============================================================================

CREATE TYPE channel_type AS ENUM (
    'AMAZON', 'FLIPKART', 'ONDC', 'WEBSITE', 'MEESHO', 'JIOMART', 'CUSTOM'
);

CREATE TYPE listing_status AS ENUM (
    'NOT_LISTED', 'PENDING', 'LIVE', 'SUPPRESSED', 'ERROR'
);

CREATE TYPE sync_frequency AS ENUM (
    'MANUAL', 'HOURLY', 'DAILY', 'WEEKLY'
);

-- ============================================================================
-- 2. CHANNEL TABLE
-- ============================================================================

CREATE TABLE channel (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenant(id),
    channel_type        channel_type NOT NULL,
    channel_name        VARCHAR(255) NOT NULL,
    credentials         JSONB DEFAULT '{}'::jsonb,
    field_mapping       JSONB DEFAULT '{}'::jsonb,
    is_active           BOOLEAN DEFAULT TRUE,
    sync_frequency      sync_frequency DEFAULT 'MANUAL',
    last_synced_at      TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_channel_tenant_id ON channel(tenant_id);
CREATE INDEX idx_channel_tenant_type ON channel(tenant_id, channel_type);
CREATE UNIQUE INDEX idx_channel_tenant_name ON channel(tenant_id, channel_name);

CREATE TRIGGER trg_channel_updated_at
    BEFORE UPDATE ON channel FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. PRODUCT CHANNEL LISTING TABLE
-- ============================================================================

CREATE TABLE product_channel_listing (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id              UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
    channel_id              UUID NOT NULL REFERENCES channel(id) ON DELETE CASCADE,
    tenant_id               UUID NOT NULL REFERENCES tenant(id),
    listing_status          listing_status DEFAULT 'NOT_LISTED',
    external_listing_id     VARCHAR(500),
    external_url            VARCHAR(500),
    channel_specific_data   JSONB DEFAULT '{}'::jsonb,
    channel_price           DECIMAL(12,2),
    channel_compare_price   DECIMAL(12,2),
    last_synced_at          TIMESTAMP,
    sync_error              TEXT,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pcl_product_id ON product_channel_listing(product_id);
CREATE INDEX idx_pcl_channel_id ON product_channel_listing(channel_id);
CREATE INDEX idx_pcl_tenant_id ON product_channel_listing(tenant_id);
CREATE UNIQUE INDEX idx_pcl_product_channel ON product_channel_listing(product_id, channel_id);
CREATE INDEX idx_pcl_tenant_status ON product_channel_listing(tenant_id, listing_status);

CREATE TRIGGER trg_pcl_updated_at
    BEFORE UPDATE ON product_channel_listing FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. SEED: Default ONDC channel for demo tenant
-- ============================================================================

INSERT INTO channel (id, tenant_id, channel_type, channel_name, credentials, is_active)
VALUES (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'ONDC',
    'ONDC Network',
    '{}'::jsonb,
    TRUE
);

COMMIT;
