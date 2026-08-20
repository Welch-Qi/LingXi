-- Marketing campaign/publish + sales reception sessions

ALTER TABLE lingxi_biz.mkg_content_asset
    ADD COLUMN IF NOT EXISTS views INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS leads INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS lingxi_biz.mkg_campaign (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    channels        VARCHAR(512),
    budget          VARCHAR(64),
    spent_pct       INT NOT NULL DEFAULT 0,
    roas            VARCHAR(32),
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    period_label    VARCHAR(64),
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_mkg_campaign_biz UNIQUE (tenant_id, biz_code)
);

CREATE TABLE IF NOT EXISTS lingxi_biz.mkg_publish_job (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    content_id      BIGINT NOT NULL,
    channels        JSONB NOT NULL DEFAULT '[]'::jsonb,
    scheduled_at    TIMESTAMPTZ,
    description     TEXT,
    keywords        VARCHAR(512),
    status          VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mkg_publish_tenant ON lingxi_biz.mkg_publish_job(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lingxi_biz.sales_reception_session (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    contact_name    VARCHAR(128) NOT NULL,
    avatar_text     VARCHAR(8),
    market          VARCHAR(64),
    source          VARCHAR(64),
    intent_level    VARCHAR(16),
    product         VARCHAR(256),
    waiting         VARCHAR(64),
    unread_count    INT NOT NULL DEFAULT 0,
    last_summary    VARCHAR(512),
    lead_id         BIGINT,
    customer_id     BIGINT,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_sales_session_biz UNIQUE (tenant_id, biz_code)
);

CREATE TABLE IF NOT EXISTS lingxi_biz.sales_reception_message (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    session_id      BIGINT NOT NULL,
    sender_type     VARCHAR(16) NOT NULL,
    body            TEXT NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sales_session_tenant ON lingxi_biz.sales_reception_session(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_msg_session ON lingxi_biz.sales_reception_message(tenant_id, session_id, sent_at);
