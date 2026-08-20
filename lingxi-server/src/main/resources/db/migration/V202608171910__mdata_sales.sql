-- B2: master data + sales CRM P0
CREATE TABLE IF NOT EXISTS lingxi_core.dc_customer (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    customer_type   VARCHAR(32) DEFAULT 'ENTERPRISE',
    country         VARCHAR(64),
    industry        VARCHAR(128),
    website         VARCHAR(512),
    domain          VARCHAR(256),
    credit_level    VARCHAR(32),
    owner_user_id   BIGINT,
    tags            JSONB,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_dc_customer_biz UNIQUE (tenant_id, biz_code)
);

CREATE TABLE IF NOT EXISTS lingxi_core.dc_product (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    sku             VARCHAR(128) NOT NULL,
    name_i18n       JSONB NOT NULL DEFAULT '{}'::jsonb,
    brand           VARCHAR(128),
    category        VARCHAR(128),
    hs_code         VARCHAR(64),
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_dc_product_biz UNIQUE (tenant_id, biz_code),
    CONSTRAINT uk_dc_product_sku UNIQUE (tenant_id, sku)
);

CREATE TABLE IF NOT EXISTS lingxi_core.dc_channel (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    channel_type    VARCHAR(64) NOT NULL,
    cover_region    VARCHAR(128),
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_dc_channel_biz UNIQUE (tenant_id, biz_code)
);

CREATE TABLE IF NOT EXISTS lingxi_biz.sales_lead (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    company_name    VARCHAR(256) NOT NULL,
    contact_name    VARCHAR(128),
    email           VARCHAR(256),
    phone           VARCHAR(64),
    country         VARCHAR(64),
    source_channel  VARCHAR(64),
    score           INT DEFAULT 0,
    status          VARCHAR(32) NOT NULL DEFAULT 'NEW',
    owner_user_id   BIGINT,
    customer_id     BIGINT,
    remark          TEXT,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_sales_lead_biz UNIQUE (tenant_id, biz_code)
);

CREATE INDEX IF NOT EXISTS idx_sales_lead_tenant_status ON lingxi_biz.sales_lead(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_lead_company ON lingxi_biz.sales_lead(tenant_id, company_name);

CREATE TABLE IF NOT EXISTS lingxi_biz.sales_opportunity (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    customer_id     BIGINT,
    lead_id         BIGINT,
    stage           VARCHAR(64) NOT NULL DEFAULT 'DISCOVER',
    amount_minor    BIGINT DEFAULT 0,
    currency        VARCHAR(8) DEFAULT 'USD',
    owner_user_id   BIGINT,
    expected_close  DATE,
    lost_reason     VARCHAR(512),
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_sales_opp_biz UNIQUE (tenant_id, biz_code)
);
