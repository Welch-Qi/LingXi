package com.lingxi;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.DisabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 认证与权限集成测试：验证 login-url / me / permissions/check / health 在完整应用上下文中可用。
 * 依赖本机 PostgreSQL；若库未就绪，可加 -Dsmoke.skip=true 跳过。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@DisabledIfSystemProperty(named = "smoke.skip", matches = "true")
class AuthFlowIntegrationTest {

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("lingxi.security.dev-bypass", () -> "true");
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginUrlReturnsLoginUrlAndState() throws Exception {
        mockMvc.perform(get("/api/v1/auth/login-url"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.loginUrl").exists())
                .andExpect(jsonPath("$.data.state").exists());
    }

    @Test
    void meReturnsUserTenantAndPermissionsWithDevBypassHeaders() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("X-User-Id", "10086001")
                        .header("X-Tenant-Id", "10086")
                        .header("X-Roles", "role_admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value("10086001"))
                .andExpect(jsonPath("$.data.tenantId").value(10086))
                .andExpect(jsonPath("$.data.permissions").isArray());
    }

    @Test
    void permissionCheckAllowsAdminWildcardPermission() throws Exception {
        mockMvc.perform(get("/api/v1/iam/permissions/check")
                        .param("permCode", "sal:lead:view")
                        .header("X-User-Id", "10086001")
                        .header("X-Tenant-Id", "10086")
                        .header("X-Roles", "role_admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.allowed").value(true));
    }

    @Test
    void permissionCheckDeniesUnknownPermissionForNonAdminUser() throws Exception {
        mockMvc.perform(get("/api/v1/iam/permissions/check")
                        .param("permCode", "nonexistent:perm")
                        .header("X-User-Id", "10086003")
                        .header("X-Tenant-Id", "10086")
                        .header("X-Roles", "role_sales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.allowed").value(false));
    }

    @Test
    void healthEndpointRemainsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("UP"));
    }
}
