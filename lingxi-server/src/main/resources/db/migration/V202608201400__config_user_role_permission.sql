-- M3 config center: users, roles, role-permission links, permission tree

CREATE TABLE IF NOT EXISTS lingxi_platform.cc_user (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    display_name    VARCHAR(128) NOT NULL,
    email           VARCHAR(256) NOT NULL,
    phone           VARCHAR(64),
    department      VARCHAR(128),
    title           VARCHAR(128),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_cc_user_tenant_biz UNIQUE (tenant_id, biz_code),
    CONSTRAINT uk_cc_user_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_cc_user_tenant ON lingxi_platform.cc_user(tenant_id);

CREATE TABLE IF NOT EXISTS lingxi_platform.cc_role (
    id              BIGINT PRIMARY KEY,
    legacy_id       UUID UNIQUE,
    tenant_id       BIGINT NOT NULL,
    biz_code        VARCHAR(64) NOT NULL,
    name            VARCHAR(128) NOT NULL,
    description     VARCHAR(512),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_cc_role_tenant_biz UNIQUE (tenant_id, biz_code)
);

CREATE INDEX IF NOT EXISTS idx_cc_role_tenant ON lingxi_platform.cc_role(tenant_id);

CREATE TABLE IF NOT EXISTS lingxi_platform.cc_role_permission (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    role_id         BIGINT NOT NULL,
    permission_code VARCHAR(128) NOT NULL,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_cc_role_perm UNIQUE (tenant_id, role_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_cc_role_perm_role ON lingxi_platform.cc_role_permission(tenant_id, role_id);

CREATE TABLE IF NOT EXISTS lingxi_platform.cc_permission (
    id              BIGINT PRIMARY KEY,
    tenant_id       BIGINT NOT NULL,
    permission_code VARCHAR(128) NOT NULL,
    name            VARCHAR(256) NOT NULL,
    parent_id       BIGINT,
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted      SMALLINT NOT NULL DEFAULT 0,
    version         INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_cc_permission_code UNIQUE (tenant_id, permission_code)
);

CREATE INDEX IF NOT EXISTS idx_cc_permission_tenant ON lingxi_platform.cc_permission(tenant_id, sort_order);
