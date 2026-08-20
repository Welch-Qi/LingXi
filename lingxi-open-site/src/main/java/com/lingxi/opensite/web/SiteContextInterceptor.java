package com.lingxi.opensite.web;

import com.lingxi.opensite.config.OpenSiteProperties;
import com.lingxi.opensite.domain.SiteBinding;
import com.lingxi.opensite.domain.SiteContext;
import com.lingxi.opensite.domain.SiteErrorCodes;
import com.lingxi.opensite.infra.SiteRegistry;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 开放分区站点头校验（在 DispatcherServlet 内执行，异常可进入 GlobalExceptionHandler）。
 */
@Component
public class SiteContextInterceptor implements HandlerInterceptor {

    public static final String HEADER_TENANT_ID = "X-Tenant-Id";
    public static final String HEADER_SITE_ID = "X-Site-Id";
    public static final String HEADER_SITE_CHANNEL = "X-Site-Channel";
    public static final String HEADER_SITE_CLIENT_SECRET = "X-Site-Client-Secret";
    public static final String HEADER_IDEMPOTENCY_KEY = "X-Idempotency-Key";

    private final OpenSiteProperties properties;
    private final SiteRegistry siteRegistry;

    public SiteContextInterceptor(OpenSiteProperties properties, SiteRegistry siteRegistry) {
        this.properties = properties;
        this.siteRegistry = siteRegistry;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!properties.isEnabled()) {
            return true;
        }

        String siteId = request.getHeader(HEADER_SITE_ID);
        String channel = request.getHeader(HEADER_SITE_CHANNEL);
        Long tenantId = parseLong(request.getHeader(HEADER_TENANT_ID));

        if (!StringUtils.hasText(siteId)) {
            throw new BizException(SiteErrorCodes.SITE_INVALID, "X-Site-Id is required");
        }
        if (!StringUtils.hasText(channel)) {
            throw new BizException(SiteErrorCodes.SITE_INVALID, "X-Site-Channel is required");
        }
        if (tenantId == null) {
            throw new BizException(SiteErrorCodes.SITE_TENANT_MISMATCH, "X-Tenant-Id is required");
        }

        SiteBinding binding = siteRegistry.require(siteId.trim());
        siteRegistry.assertTenantMatch(binding, tenantId);
        if (StringUtils.hasText(binding.channel()) && !binding.channel().equalsIgnoreCase(channel.trim())) {
            throw new BizException(SiteErrorCodes.SITE_INVALID,
                    "X-Site-Channel mismatch, expected=" + binding.channel());
        }

        boolean authenticated = isAuthenticated();
        String clientSecret = request.getHeader(HEADER_SITE_CLIENT_SECRET);
        if (!authenticated) {
            if (!properties.isAllowClientSecretAuth()) {
                throw new BizException(SiteErrorCodes.SITE_CREDENTIAL_INVALID, "authentication required");
            }
            siteRegistry.assertCredential(binding, clientSecret, true);
        } else if (StringUtils.hasText(clientSecret)) {
            siteRegistry.assertCredential(binding, clientSecret, true);
        }

        SiteContext.set(binding);
        TenantContext.setTenantId(binding.tenantId());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        SiteContext.clear();
    }

    private static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated()
                && auth.getPrincipal() != null
                && !"anonymousUser".equals(auth.getPrincipal());
    }

    private static Long parseLong(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
