package com.lingxi.iam.app;

import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = IamPermissionController.class)
@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc(addFilters = false)
class IamPermissionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CasbinPermissionDecisionService permissionDecisionClient;

    @MockBean
    private PolicyAdminService policyAdminService;

    @BeforeEach
    void setUp() {
        UserContext.set(new UserContext.UserPrincipal(
                "10086001", "admin", "Admin", 10086L, List.of("role_admin"), DataScope.ALL, "10086001"));
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void checkReturnsAllowedWhenPermitted() throws Exception {
        when(permissionDecisionClient.enforce(eq("10086001"), eq(10086L), eq("sal:lead:view")))
                .thenReturn(true);

        mockMvc.perform(get("/api/v1/iam/permissions/check").param("permCode", "sal:lead:view"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.allowed").value(true))
                .andExpect(jsonPath("$.data.permCode").value("sal:lead:view"));
    }

    @Test
    void checkReturnsDeniedWhenNotPermitted() throws Exception {
        when(permissionDecisionClient.enforce(eq("10086001"), eq(10086L), eq("nonexistent:perm")))
                .thenReturn(false);

        mockMvc.perform(get("/api/v1/iam/permissions/check").param("permCode", "nonexistent:perm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.allowed").value(false));
    }

    @Test
    void policiesReturnsPolicyAndGrouping() throws Exception {
        Map<String, List<List<String>>> payload = new LinkedHashMap<>();
        payload.put("p", List.of(List.of("role_admin", "*", "*", "*")));
        payload.put("g", List.of(List.of("10086001", "role_admin", "10086")));
        when(policyAdminService.listPolicies()).thenReturn(payload.get("p"));
        when(policyAdminService.listGrouping()).thenReturn(payload.get("g"));
        when(permissionDecisionClient.enforce(anyString(), anyLong(), eq("cc:perm:view")))
                .thenReturn(true);

        mockMvc.perform(get("/api/v1/iam/policies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.p[0][0]").value("role_admin"))
                .andExpect(jsonPath("$.data.g[0][0]").value("10086001"));
    }
}
