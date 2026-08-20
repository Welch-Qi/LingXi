-- B3: market insight P0
CREATE TABLE IF NOT EXISTS lingxi_biz.mkt_hot_keyword (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    keyword         VARCHAR(256) NOT NULL,
    category        VARCHAR(128),
    region          VARCHAR(64),
    heat_score      INT NOT NULL DEFAULT 0,
    trend           VARCHAR(16) NOT NULL DEFAULT 'FLAT',
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lingxi_biz.mkt_search_trend (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    keyword         VARCHAR(256) NOT NULL,
    region          VARCHAR(64) NOT NULL,
    metric_date     DATE NOT NULL,
    index_value     INT NOT NULL DEFAULT 0,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mkt_trend_kw ON lingxi_biz.mkt_search_trend(tenant_id, keyword, region, metric_date);

CREATE TABLE IF NOT EXISTS lingxi_biz.mkt_opportunity (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    title           VARCHAR(512) NOT NULL,
    product_hint    VARCHAR(256),
    target_market   VARCHAR(128),
    score           INT NOT NULL DEFAULT 0,
    summary         TEXT,
    status          VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_mkt_opp_biz UNIQUE (tenant_id, biz_code)
);
