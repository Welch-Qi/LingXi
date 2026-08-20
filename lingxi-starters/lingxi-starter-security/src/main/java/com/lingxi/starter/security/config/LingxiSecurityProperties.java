package com.lingxi.starter.security.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "lingxi.security")
public class LingxiSecurityProperties {

    /**
     * 是否启用安全过滤器（默认 true）。
     */
    private boolean enabled = true;

    /**
     * 本地开发旁路：使用 X-User-Id / X-Tenant-Id / X-Roles 模拟登录（禁止生产开启）。
     */
    private boolean devBypass = false;

    /**
     * 放行路径。
     */
    private List<String> permitAll = new ArrayList<>(List.of(
            "/actuator/health",
            "/actuator/info",
            "/api/v1/health",
            "/api/v1/auth/login-url",
            "/api/v1/auth/callback",
            "/error"
    ));

    private final Casdoor casdoor = new Casdoor();

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isDevBypass() {
        return devBypass;
    }

    public void setDevBypass(boolean devBypass) {
        this.devBypass = devBypass;
    }

    public List<String> getPermitAll() {
        return permitAll;
    }

    public void setPermitAll(List<String> permitAll) {
        this.permitAll = permitAll;
    }

    public Casdoor getCasdoor() {
        return casdoor;
    }

    public static class Casdoor {
        /** Casdoor 根地址，如 http://localhost:8000 */
        private String endpoint = "http://localhost:8000";
        private String clientId = "lingxi-web";
        private String clientSecret = "lingxi-secret";
        private String organization = "lingxi";
        private String application = "lingxi-web";
        private String redirectUri = "http://localhost:3000/auth/callback";
        /** JWKS，默认 {endpoint}/.well-known/jwks */
        private String jwkSetUri;
        /** 租户 claim 名（Casdoor 自定义属性） */
        private String tenantClaim = "tenantId";
        private String rolesClaim = "roles";

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public String getClientId() {
            return clientId;
        }

        public void setClientId(String clientId) {
            this.clientId = clientId;
        }

        public String getClientSecret() {
            return clientSecret;
        }

        public void setClientSecret(String clientSecret) {
            this.clientSecret = clientSecret;
        }

        public String getOrganization() {
            return organization;
        }

        public void setOrganization(String organization) {
            this.organization = organization;
        }

        public String getApplication() {
            return application;
        }

        public void setApplication(String application) {
            this.application = application;
        }

        public String getRedirectUri() {
            return redirectUri;
        }

        public void setRedirectUri(String redirectUri) {
            this.redirectUri = redirectUri;
        }

        public String getJwkSetUri() {
            if (jwkSetUri != null && !jwkSetUri.isBlank()) {
                return jwkSetUri;
            }
            String base = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
            return base + "/.well-known/jwks";
        }

        public void setJwkSetUri(String jwkSetUri) {
            this.jwkSetUri = jwkSetUri;
        }

        public String getTenantClaim() {
            return tenantClaim;
        }

        public void setTenantClaim(String tenantClaim) {
            this.tenantClaim = tenantClaim;
        }

        public String getRolesClaim() {
            return rolesClaim;
        }

        public void setRolesClaim(String rolesClaim) {
            this.rolesClaim = rolesClaim;
        }
    }
}
