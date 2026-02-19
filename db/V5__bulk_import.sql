-- Bulk import job table
CREATE TYPE import_status AS ENUM ('PENDING', 'VALIDATING', 'IMPORTING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE bulk_import_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id),
    user_id UUID NOT NULL REFERENCES "user"(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    status import_status NOT NULL DEFAULT 'PENDING',
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    error_log JSONB,
    column_mapping JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_job_tenant ON bulk_import_job(tenant_id);
CREATE INDEX idx_import_job_status ON bulk_import_job(tenant_id, status);

CREATE TRIGGER set_import_job_updated_at
    BEFORE UPDATE ON bulk_import_job
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
