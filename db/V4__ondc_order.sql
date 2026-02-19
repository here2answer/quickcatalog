-- ONDC Order tables for Beckn order lifecycle
CREATE TYPE ondc_order_state AS ENUM ('CREATED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RETURNED');

CREATE TABLE ondc_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beckn_order_id VARCHAR(255) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    ondc_provider_id UUID REFERENCES ondc_provider(id),
    state ondc_order_state NOT NULL DEFAULT 'CREATED',
    items JSONB,
    billing JSONB,
    fulfillment JSONB,
    payment JSONB,
    quote JSONB,
    cancellation_reason VARCHAR(255),
    cancelled_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ondc_order_tenant ON ondc_order(tenant_id);
CREATE INDEX idx_ondc_order_beckn_id ON ondc_order(beckn_order_id);
CREATE INDEX idx_ondc_order_state ON ondc_order(tenant_id, state);
CREATE INDEX idx_ondc_order_provider ON ondc_order(ondc_provider_id);

CREATE TABLE ondc_order_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ondc_order_id UUID NOT NULL REFERENCES ondc_order(id) ON DELETE CASCADE,
    product_id UUID REFERENCES product(id),
    variant_id UUID REFERENCES product_variant(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL
);

CREATE INDEX idx_ondc_order_item_order ON ondc_order_item(ondc_order_id);

-- Trigger for updated_at
CREATE TRIGGER set_ondc_order_updated_at
    BEFORE UPDATE ON ondc_order
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
