package com.lingxi.opensite.domain;

/**
 * 当前请求绑定的触点站点上下文。
 */
public record SiteBinding(
        String siteId,
        Long tenantId,
        String channel,
        String displayName,
        String clientSecret
) {
}
