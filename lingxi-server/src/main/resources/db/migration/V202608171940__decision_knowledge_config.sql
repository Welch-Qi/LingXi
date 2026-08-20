-- B5 decision KPI + B6 knowledge + config industry
CREATE TABLE IF NOT EXISTS lingxi_biz.dm_kpi_snapshot (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    metric_code     VARCHAR(64) NOT NULL,
    metric_name     VARCHAR(128) NOT NULL,
    metric_value    NUMERIC(20, 4) NOT NULL DEFAULT 0,
    unit            VARCHAR(32),
    period_key      VARCHAR(32) NOT NULL,
    dimensions      JSONB,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dm_kpi_period ON lingxi_biz.dm_kpi_snapshot(tenant_id, period_key, metric_code);

CREATE TABLE IF NOT EXISTS lingxi_platform.kc_template (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    category        VARCHAR(64),
    locale          VARCHAR(16) DEFAULT 'zh-CN',
    body            TEXT NOT NULL,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_kc_template_biz UNIQUE (tenant_id, biz_code)
);

CREATE TABLE IF NOT EXISTS lingxi_platform.kc_script (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    scene           VARCHAR(64) NOT NULL,
    locale          VARCHAR(16) DEFAULT 'zh-CN',
    body            TEXT NOT NULL,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_kc_script_biz UNIQUE (tenant_id, biz_code)
);

CREATE TABLE IF NOT EXISTS lingxi_platform.kc_prompt (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    prompt_code     VARCHAR(128) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    agent_domain    VARCHAR(64),
    body            TEXT NOT NULL,
    version_label   VARCHAR(32) DEFAULT 'v1',
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_kc_prompt_code UNIQUE (tenant_id, prompt_code)
);

CREATE TABLE IF NOT EXISTS lingxi_platform.cc_industry (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    industry_code   VARCHAR(64) NOT NULL,
    industry_name   VARCHAR(256) NOT NULL,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_cc_industry UNIQUE (tenant_id, industry_code)
);
