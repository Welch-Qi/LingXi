package com.lingxi.starter.security.web;

import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.config.LingxiSecurityProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 开发旁路：从请求头注入用户上下文，便于无 Casdoor 时联调。
 * Headers: X-User-Id, X-Tenant-Id, X-Username, X-Roles(逗号分隔), X-Data-Scope
 */
public class DevBypassAuthenticationFilter extends OncePerRequestFilter {

    public static final String HEADER_USER_ID = "X-User-Id";
    public static final String HEADER_TENANT_ID = "X-Tenant-Id";
    public static final String HEADER_USERNAME = "X-Username";
    public static final String HEADER_ROLES = "X-Roles";
    public static final String HEADER_DATA_SCOPE = "X-Data-Scope";

    private final LingxiSecurityProperties properties;

    public DevBypassAuthenticationFilter(LingxiSecurityProperties properties) {
        this.properties = properties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !properties.isDevBypass() || !StringUtils.hasText(request.getHeader(HEADER_USER_ID));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String userId = request.getHeader(HEADER_USER_ID);
        Long tenantId = parseLong(request.getHeader(HEADER_TENANT_ID));
        String username = firstNonBlank(request.getHeader(HEADER_USERNAME), userId);
        List<String> roles = parseRoles(request.getHeader(HEADER_ROLES));
        DataScope dataScope = parseDataScope(request.getHeader(HEADER_DATA_SCOPE));

        UserContext.UserPrincipal principal = new UserContext.UserPrincipal(
                userId, username, username, tenantId, roles, dataScope, userId);
        UserContext.set(principal);
        if (tenantId != null) {
            TenantContext.setTenantId(tenantId);
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        for (String role : roles) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userId, "dev-bypass", authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
            TenantContext.clear();
            SecurityContextHolder.clearContext();
        }
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

    private static List<String> parseRoles(String value) {
        if (!StringUtils.hasText(value)) {
            return List.of("admin");
        }
        return Arrays.stream(value.split("[, ]+"))
                .filter(StringUtils::hasText)
                .map(String::trim)
                .toList();
    }

    private static DataScope parseDataScope(String value) {
        if (!StringUtils.hasText(value)) {
            return DataScope.ALL;
        }
        try {
            return DataScope.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return DataScope.ALL;
        }
    }

    private static String firstNonBlank(String a, String b) {
        return StringUtils.hasText(a) ? a : b;
    }
}
