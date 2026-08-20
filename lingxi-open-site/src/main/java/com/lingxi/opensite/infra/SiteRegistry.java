package com.lingxi.opensite.infra;

import com.lingxi.opensite.config.OpenSiteProperties;
import com.lingxi.opensite.domain.SiteBinding;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.opensite.domain.SiteErrorCodes;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * P0：基于配置的站点注册表（后续可换 DB / SiteConnector）。
 */
@Component
public class SiteRegistry {

    private final Map<String, SiteBinding> bySiteId = new ConcurrentHashMap<>();

    public SiteRegistry(OpenSiteProperties properties) {
        for (OpenSiteProperties.Site site : properties.getSites()) {
            if (!StringUtils.hasText(site.getSiteId()) || site.getTenantId() == null) {
                continue;
            }
            bySiteId.put(site.getSiteId(), new SiteBinding(
                    site.getSiteId(),
                    site.getTenantId(),
                    site.getChannel(),
                    site.getDisplayName(),
                    site.getClientSecret()
            ));
        }
    }

    public SiteBinding require(String siteId) {
        SiteBinding binding = bySiteId.get(siteId);
        if (binding == null) {
            throw new BizException(SiteErrorCodes.SITE_INVALID, "site not registered: " + siteId);
        }
        return binding;
    }

    public void assertTenantMatch(SiteBinding binding, Long tenantId) {
        if (tenantId == null || !tenantId.equals(binding.tenantId())) {
            throw new BizException(SiteErrorCodes.SITE_TENANT_MISMATCH,
                    "site/tenant mismatch: site=" + binding.siteId() + ", tenant=" + tenantId);
        }
    }

    public void assertCredential(SiteBinding binding, String clientSecret, boolean allowClientSecretAuth) {
        if (!allowClientSecretAuth) {
            return;
        }
        if (!StringUtils.hasText(binding.clientSecret())) {
            return;
        }
        if (!StringUtils.hasText(clientSecret) || !binding.clientSecret().equals(clientSecret)) {
            throw new BizException(SiteErrorCodes.SITE_CREDENTIAL_INVALID, "invalid site client secret");
        }
    }
}
