-- Phase 4: Bulk & Polish migration
BEGIN;

-- 1. Import job status enum
CREATE TYPE import_status AS ENUM ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- 2. Extend action_type enum
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'IMPORTED';

-- 3. Bulk import job table
CREATE TABLE bulk_import_job (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenant(id),
    file_name       VARCHAR(500) NOT NULL,
    file_url        VARCHAR(500),
    total_rows      INT DEFAULT 0,
    processed_rows  INT DEFAULT 0,
    success_count   INT DEFAULT 0,
    error_count     INT DEFAULT 0,
    status          import_status DEFAULT 'UPLOADED',
    error_log       JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    created_by      UUID REFERENCES "user"(id)
);

CREATE INDEX idx_bulk_import_job_tenant ON bulk_import_job(tenant_id);
CREATE INDEX idx_bulk_import_job_status ON bulk_import_job(tenant_id, status);

CREATE TRIGGER trg_bulk_import_job_updated_at
    BEFORE UPDATE ON bulk_import_job FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
