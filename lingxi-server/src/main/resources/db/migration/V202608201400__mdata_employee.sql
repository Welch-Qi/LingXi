-- M2: employee master data
CREATE TABLE IF NOT EXISTS lingxi_core.dc_employee (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    department      VARCHAR(128),
    position        VARCHAR(128),
    phone           VARCHAR(64),
    email           VARCHAR(256),
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_dc_employee_biz UNIQUE (tenant_id, biz_code)
);

CREATE INDEX IF NOT EXISTS idx_dc_employee_tenant_name ON lingxi_core.dc_employee(tenant_id, name);
