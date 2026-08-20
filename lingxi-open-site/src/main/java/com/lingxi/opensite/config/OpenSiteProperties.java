package com.lingxi.opensite.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "lingxi.open-site")
public class OpenSiteProperties {

    private boolean enabled = true;

    /**
     * P0：写操作是否强制要求 X-Idempotency-Key（默认 true）。
     */
    private boolean requireIdempotencyKey = true;

    /**
     * P0：未携带 Bearer 时，是否允许用 X-Site-Client-Secret 完成站点鉴权（开发/联调）。
     * 生产应关闭，改用 Casdoor M2M JWT。
     */
    private boolean allowClientSecretAuth = true;

    private List<Site> sites = new ArrayList<>();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isRequireIdempotencyKey() {
        return requireIdempotencyKey;
    }

    public void setRequireIdempotencyKey(boolean requireIdempotencyKey) {
        this.requireIdempotencyKey = requireIdempotencyKey;
    }

    public boolean isAllowClientSecretAuth() {
        return allowClientSecretAuth;
    }

    public void setAllowClientSecretAuth(boolean allowClientSecretAuth) {
        this.allowClientSecretAuth = allowClientSecretAuth;
    }

    public List<Site> getSites() {
        return sites;
    }

    public void setSites(List<Site> sites) {
        this.sites = sites;
    }

    public static class Site {
        private String siteId;
        private Long tenantId;
        private String channel = "storefront";
        private String displayName;
        private String clientSecret;

        public String getSiteId() {
            return siteId;
        }

        public void setSiteId(String siteId) {
            this.siteId = siteId;
        }

        public Long getTenantId() {
            return tenantId;
        }

        public void setTenantId(Long tenantId) {
            this.tenantId = tenantId;
        }

        public String getChannel() {
            return channel;
        }

        public void setChannel(String channel) {
            this.channel = channel;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public String getClientSecret() {
            return clientSecret;
        }

        public void setClientSecret(String clientSecret) {
            this.clientSecret = clientSecret;
        }
    }
}
