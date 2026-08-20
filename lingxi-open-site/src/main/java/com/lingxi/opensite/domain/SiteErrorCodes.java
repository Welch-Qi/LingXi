package com.lingxi.opensite.domain;

/**
 * 触点开放错误码（03xxxx），与《技术规约》附录一致。
 */
public final class SiteErrorCodes {

    public static final String SITE_INVALID = "030001";
    public static final String SITE_TENANT_MISMATCH = "030002";
    public static final String SITE_CREDENTIAL_INVALID = "030003";
    public static final String PRODUCT_VERSION_CONFLICT = "030004";
    public static final String ORDER_IDEMPOTENCY_CONFLICT = "030005";

    private SiteErrorCodes() {
    }
}
