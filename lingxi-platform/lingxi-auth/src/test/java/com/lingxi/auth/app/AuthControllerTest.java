package com.lingxi.auth.app;

import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.security.permission.PermissionDecisionClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CasdoorAuthService casdoorAuthService;

    @MockBean
    private PermissionDecisionClient permissionDecisionClient;

    @BeforeEach
    void setUp() {
        UserContext.clear();
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void loginUrlReturnsLoginUrlAndState() throws Exception {
        Map<String, String> payload = Map.of(
                "loginUrl", "http://localhost:8000/login/oauth/authorize?client_id=lingxi-web",
                "state", "abc123");
        when(casdoorAuthService.buildLoginUrl(null)).thenReturn(payload);

        mockMvc.perform(get("/api/v1/auth/login-url"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.loginUrl").value(payload.get("loginUrl")))
                .andExpect(jsonPath("$.data.state").value("abc123"));
    }

    @Test
    void callbackExchangesCodeForToken() throws Exception {
        Map<String, Object> token = new LinkedHashMap<>();
        token.put("accessToken", "access-token");
        token.put("refreshToken", "refresh-token");
        token.put("tokenType", "Bearer");
        token.put("expiresIn", 3600L);
        token.put("scope", "openid profile email");
        when(casdoorAuthService.exchangeCode("auth-code")).thenReturn(token);

        mockMvc.perform(post("/api/v1/auth/callback")
                        .param("code", "auth-code")
                        .param("state", "state-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.state").value("state-1"));
    }

    @Test
    void loginExchangesCodeFromJsonBody() throws Exception {
        Map<String, Object> token = new LinkedHashMap<>();
        token.put("accessToken", "access-token");
        token.put("refreshToken", "refresh-token");
        token.put("tokenType", "Bearer");
        token.put("expiresIn", 3600L);
        token.put("scope", "openid profile email");
        when(casdoorAuthService.exchangeCode("auth-code")).thenReturn(token);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"code":"auth-code","state":"state-1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("access-token"))
                .andExpect(jsonPath("$.data.state").value("state-1"));
    }

    @Test
    void meReturnsUserTenantAndPermissions() throws Exception {
        UserContext.set(new UserContext.UserPrincipal(
                "10086001", "admin", "Admin", 10086L, List.of("role_admin"), DataScope.ALL, "10086001"));
        when(permissionDecisionClient.listPermissions(eq("10086001"), eq(10086L)))
                .thenReturn(List.of("cc:perm:view", "sal:lead:view"));

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value("10086001"))
                .andExpect(jsonPath("$.data.tenantId").value(10086))
                .andExpect(jsonPath("$.data.permissions[0]").value("cc:perm:view"))
                .andExpect(jsonPath("$.data.permissions[1]").value("sal:lead:view"));

        verify(permissionDecisionClient).listPermissions("10086001", 10086L);
    }

    @Test
    void logoutUrlReturnsLogoutUrl() throws Exception {
        when(casdoorAuthService.buildLogoutUrl(null)).thenReturn("http://localhost:8000/logout");

        mockMvc.perform(get("/api/v1/auth/logout-url"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.logoutUrl").value("http://localhost:8000/logout"));
    }
}
