package com.lingxi.starter.security.jwt;

import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.config.LingxiSecurityProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CasdoorJwtAuthenticationConverterTest {

    private CasdoorJwtAuthenticationConverter converter;

    @BeforeEach
    void setUp() {
        LingxiSecurityProperties properties = new LingxiSecurityProperties();
        properties.getCasdoor().setTenantClaim("tenantId");
        properties.getCasdoor().setRolesClaim("roles");
        converter = new CasdoorJwtAuthenticationConverter(properties);
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
        TenantContext.clear();
    }

    @Test
    void convertsJwtClaimsToUserPrincipal() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("lingxi/admin")
                .claim("name", "lingxi/admin")
                .claim("displayName", "Admin User")
                .claim("tenantId", 10086)
                .claim("roles", List.of("lingxi/role_admin"))
                .claim("dataScope", "ALL")
                .claim("properties", Map.of("userId", "10086001"))
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        converter.convert(jwt);

        UserContext.UserPrincipal principal = UserContext.require();
        assertThat(principal.getUserId()).isEqualTo("10086001");
        assertThat(principal.getUsername()).isEqualTo("admin");
        assertThat(principal.getDisplayName()).isEqualTo("Admin User");
        assertThat(principal.getTenantId()).isEqualTo(10086L);
        assertThat(principal.getRoles()).containsExactly("role_admin");
        assertThat(principal.getDataScope()).isEqualTo(DataScope.ALL);
        assertThat(TenantContext.getTenantId()).isEqualTo(10086L);
    }

    @Test
    void resolvesRolesFromGroupsClaim() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .subject("u_sales")
                .claim("groups", "role_sales")
                .claim("tenantId", "10086")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        converter.convert(jwt);

        assertThat(UserContext.require().getRoles()).containsExactly("role_sales");
    }
}
