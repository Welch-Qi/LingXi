-- B1: platform core schemas + tenant/user (dual-key)
CREATE SCHEMA IF NOT EXISTS lingxi_core;
CREATE SCHEMA IF NOT EXISTS lingxi_biz;
CREATE SCHEMA IF NOT EXISTS lingxi_platform;

CREATE TABLE IF NOT EXISTS lingxi_core.sys_tenant (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    biz_code        VARCHAR(64) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    plan_code       VARCHAR(64),
    industry        VARCHAR(128),
    region          VARCHAR(64),
    timezone        VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
    language        VARCHAR(16) NOT NULL DEFAULT 'zh-CN',
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_sys_tenant_biz_code UNIQUE (biz_code)
);

CREATE TABLE IF NOT EXISTS lingxi_core.sys_user (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    email           VARCHAR(256) NOT NULL,
    display_name    VARCHAR(128) NOT NULL,
    staff_type      VARCHAR(16) NOT NULL DEFAULT 'HUMAN',
    department      VARCHAR(128),
    title           VARCHAR(128),
    phone           VARCHAR(64),
    sex             VARCHAR(16),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    casdoor_name    VARCHAR(128),
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_sys_user_tenant_biz UNIQUE (tenant_id, biz_code),
    CONSTRAINT uk_sys_user_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_sys_user_tenant ON lingxi_core.sys_user(tenant_id);
