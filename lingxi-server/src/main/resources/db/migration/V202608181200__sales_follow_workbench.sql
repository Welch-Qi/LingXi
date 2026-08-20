-- Sales follow-up / pool fields + workbench tasks & inquiry events
ALTER TABLE lingxi_biz.sales_lead
    ADD COLUMN IF NOT EXISTS website VARCHAR(512),
    ADD COLUMN IF NOT EXISTS domain VARCHAR(256),
    ADD COLUMN IF NOT EXISTS pool_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sales_lead_domain ON lingxi_biz.sales_lead(tenant_id, domain);
CREATE INDEX IF NOT EXISTS idx_sales_lead_email ON lingxi_biz.sales_lead(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_sales_lead_owner ON lingxi_biz.sales_lead(tenant_id, owner_user_id);

-- 线索跟进记录
CREATE TABLE IF NOT EXISTS lingxi_biz.sales_lead_follow (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    lead_id         BIGINT NOT NULL,
    follow_type     VARCHAR(32) NOT NULL DEFAULT 'CALL',
    content         TEXT NOT NULL,
    next_follow_at  TIMESTAMPTZ,
    operator_id     BIGINT,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sales_lead_follow_lead ON lingxi_biz.sales_lead_follow(tenant_id, lead_id);

-- 工作台统一待办
CREATE TABLE IF NOT EXISTS lingxi_biz.uw_task (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    title           VARCHAR(512) NOT NULL,
    task_type       VARCHAR(32) NOT NULL DEFAULT 'GENERAL',
    status          VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    priority        INT NOT NULL DEFAULT 50,
    assignee_id     BIGINT,
    due_at          TIMESTAMPTZ,
    source_type     VARCHAR(32),
    source_id       BIGINT,
    payload         JSONB,
    completed_at    TIMESTAMPTZ,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_uw_task_biz UNIQUE (tenant_id, biz_code)
);

CREATE INDEX IF NOT EXISTS idx_uw_task_assignee ON lingxi_biz.uw_task(tenant_id, assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_uw_task_priority ON lingxi_biz.uw_task(tenant_id, status, priority DESC);

-- 询盘 / 线索提醒事件
CREATE TABLE IF NOT EXISTS lingxi_biz.uw_inquiry_event (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    title           VARCHAR(512) NOT NULL,
    channel         VARCHAR(64),
    contact_name    VARCHAR(128),
    contact_email   VARCHAR(256),
    company_name    VARCHAR(256),
    lead_id         BIGINT,
    status          VARCHAR(32) NOT NULL DEFAULT 'NEW',
    acknowledged_by BIGINT,
    acknowledged_at TIMESTAMPTZ,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_uw_inquiry_biz UNIQUE (tenant_id, biz_code)
);

CREATE INDEX IF NOT EXISTS idx_uw_inquiry_status ON lingxi_biz.uw_inquiry_event(tenant_id, status);
