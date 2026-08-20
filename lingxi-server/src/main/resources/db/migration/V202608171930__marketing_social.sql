-- B4: marketing social + content P0
CREATE TABLE IF NOT EXISTS lingxi_biz.mkg_social_account (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    platform        VARCHAR(64) NOT NULL,
    account_name    VARCHAR(256) NOT NULL,
    auth_status     VARCHAR(32) NOT NULL DEFAULT 'DISCONNECTED',
    external_ref    VARCHAR(256),
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lingxi_biz.mkg_content_asset (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    title           VARCHAR(512) NOT NULL,
    content_type    VARCHAR(32) NOT NULL DEFAULT 'TEXT',
    body            TEXT,
    locale          VARCHAR(16) DEFAULT 'zh-CN',
    status          VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_mkg_content_biz UNIQUE (tenant_id, biz_code)
);
