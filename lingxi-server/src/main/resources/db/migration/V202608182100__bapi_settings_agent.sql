-- Config KV settings + agent config / run logs (B-API MVP)

CREATE TABLE IF NOT EXISTS lingxi_platform.cc_setting (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    setting_key     VARCHAR(64) NOT NULL,
    setting_value   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_cc_setting_key UNIQUE (tenant_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_cc_setting_tenant ON lingxi_platform.cc_setting(tenant_id);

CREATE TABLE IF NOT EXISTS lingxi_platform.ac_agent_config (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    agent_code      VARCHAR(64) NOT NULL,
    config_json     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_ac_agent_config UNIQUE (tenant_id, agent_code)
);

CREATE INDEX IF NOT EXISTS idx_ac_agent_config_tenant ON lingxi_platform.ac_agent_config(tenant_id);

CREATE TABLE IF NOT EXISTS lingxi_platform.ac_agent_run_log (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    agent_code      VARCHAR(64) NOT NULL,
    action          VARCHAR(128),
    related_object  VARCHAR(256),
    status          VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN',
    duration_ms     INT,
    payload         JSONB,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ac_agent_run_log_tenant ON lingxi_platform.ac_agent_run_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ac_agent_run_log_agent ON lingxi_platform.ac_agent_run_log(tenant_id, agent_code);
