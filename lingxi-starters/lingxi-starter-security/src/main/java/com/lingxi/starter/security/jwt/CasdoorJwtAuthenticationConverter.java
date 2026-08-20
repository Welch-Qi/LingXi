package com.lingxi.starter.security.jwt;

import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.config.LingxiSecurityProperties;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 将 Casdoor JWT 转换为 Spring Security Authentication，并写入 UserContext / TenantContext。
 */
public class CasdoorJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final LingxiSecurityProperties properties;

    public CasdoorJwtAuthenticationConverter(LingxiSecurityProperties properties) {
        this.properties = properties;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UserContext.UserPrincipal principal = toPrincipal(jwt);
        UserContext.set(principal);
        if (principal.getTenantId() != null) {
            TenantContext.setTenantId(principal.getTenantId());
        }
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        for (String role : principal.getRoles()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        return new JwtAuthenticationToken(jwt, authorities, principal.getUserId());
    }

    private UserContext.UserPrincipal toPrincipal(Jwt jwt) {
        String sub = jwt.getSubject();
        String name = firstNonBlank(jwt.getClaimAsString("name"), jwt.getClaimAsString("preferred_username"), sub);
        String display = firstNonBlank(jwt.getClaimAsString("displayName"), name);
        Long tenantId = resolveTenantId(jwt);
        List<String> roles = resolveRoles(jwt);
        DataScope dataScope = resolveDataScope(jwt);
        String userId = firstNonBlank(
                property(jwt, "userId"),
                jwt.getClaimAsString("id"),
                sub);
        // Casdoor subject 常为 org/name，取末段作展示用用户名
        if (name != null && name.contains("/")) {
            name = name.substring(name.lastIndexOf('/') + 1);
        }
        return new UserContext.UserPrincipal(userId, name, display, tenantId, roles, dataScope, sub);
    }

    private Long resolveTenantId(Jwt jwt) {
        String claim = properties.getCasdoor().getTenantClaim();
        Object value = jwt.getClaim(claim);
        if (value == null) {
            value = propertyRaw(jwt, claim);
            if (value == null) {
                value = propertyRaw(jwt, "tenant_id");
            }
        }
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        String text = String.valueOf(value);
        if (!StringUtils.hasText(text)) {
            return null;
        }
        try {
            return Long.parseLong(text);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private List<String> resolveRoles(Jwt jwt) {
        Object claim = jwt.getClaim(properties.getCasdoor().getRolesClaim());
        if (claim == null) {
            claim = jwt.getClaim("groups");
        }
        List<String> roles = new ArrayList<>();
        if (claim instanceof Collection<?> collection) {
            for (Object item : collection) {
                String role = normalizeRole(item);
                if (StringUtils.hasText(role) && !roles.contains(role)) {
                    roles.add(role);
                }
            }
        } else if (claim instanceof String text && StringUtils.hasText(text)) {
            for (String part : text.split("[, ]+")) {
                String role = normalizeRole(part.trim());
                if (StringUtils.hasText(role) && !roles.contains(role)) {
                    roles.add(role);
                }
            }
        }
        String tag = jwt.getClaimAsString("tag");
        if (StringUtils.hasText(tag)) {
            String role = normalizeRole(tag);
            if (StringUtils.hasText(role) && !roles.contains(role)) {
                roles.add(role);
            }
        }
        String propRole = property(jwt, "roles");
        if (StringUtils.hasText(propRole)) {
            for (String part : propRole.split("[, ]+")) {
                String role = normalizeRole(part.trim());
                if (StringUtils.hasText(role) && !roles.contains(role)) {
                    roles.add(role);
                }
            }
        }
        return roles;
    }

    private static String normalizeRole(Object item) {
        if (item == null) {
            return null;
        }
        if (item instanceof Map<?, ?> map) {
            Object name = map.get("name");
            if (name != null) {
                return normalizeRole(String.valueOf(name));
            }
        }
        String text = String.valueOf(item).trim();
        if (!StringUtils.hasText(text)) {
            return null;
        }
        // lingxi/role_admin → role_admin
        int slash = text.lastIndexOf('/');
        if (slash >= 0 && slash < text.length() - 1) {
            text = text.substring(slash + 1);
        }
        return text;
    }

    private DataScope resolveDataScope(Jwt jwt) {
        String scope = jwt.getClaimAsString("dataScope");
        if (!StringUtils.hasText(scope)) {
            scope = property(jwt, "dataScope");
        }
        if (!StringUtils.hasText(scope)) {
            return DataScope.SELF;
        }
        try {
            return DataScope.valueOf(scope.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return DataScope.SELF;
        }
    }

    private static Object propertyRaw(Jwt jwt, String key) {
        Map<String, Object> props = jwt.getClaim("properties");
        if (props == null) {
            return null;
        }
        return props.get(key);
    }

    private static String property(Jwt jwt, String key) {
        Object value = propertyRaw(jwt, key);
        return value == null ? null : String.valueOf(value);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return "";
    }
}
