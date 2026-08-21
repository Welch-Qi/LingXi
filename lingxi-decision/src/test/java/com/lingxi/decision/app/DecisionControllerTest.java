package com.lingxi.decision.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.decision.domain.DmKpiSnapshot;
import com.lingxi.decision.infra.mapper.DmKpiSnapshotMapper;
import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.security.permission.PermissionAspect;
import com.lingxi.starter.security.permission.PermissionDecisionClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DecisionController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(PermissionAspect.class)
class DecisionControllerTest {

    private static final long TENANT_ID = 10086L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DmKpiSnapshotMapper kpiSnapshotMapper;

    @MockBean
    private DecisionDashboardService dashboardService;

    @MockBean
    private PermissionDecisionClient permissionDecisionClient;

    @BeforeEach
    void setUp() {
        UserContext.set(new UserContext.UserPrincipal(
                "10086001", "admin", "Admin", TENANT_ID, List.of("role_admin"), DataScope.ALL, "10086001"));
        when(permissionDecisionClient.enforce(anyString(), eq(TENANT_ID), eq("dm:dashboard:view")))
                .thenReturn(true);
        when(permissionDecisionClient.enforce(anyString(), eq(TENANT_ID), eq("dm:qa:ask")))
                .thenReturn(true);
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void testDashboardReturnsResult() throws Exception {
        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("kpiCards", List.of(Map.of("key", "products")));
        dashboard.put("heatmap", Map.of("US", 80));
        dashboard.put("funnel", List.of(Map.of("label", "曝光量")));
        dashboard.put("trend", List.of(Map.of("date", "1日")));
        when(dashboardService.buildDashboard(TENANT_ID)).thenReturn(dashboard);

        mockMvc.perform(get("/api/v1/decision/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.kpiCards").isArray())
                .andExpect(jsonPath("$.data.heatmap.US").value(80))
                .andExpect(jsonPath("$.data.funnel").isArray())
                .andExpect(jsonPath("$.data.trend").isArray());
    }

    @Test
    void testAskReturnsAnswer() throws Exception {
        DmKpiSnapshot snapshot = new DmKpiSnapshot();
        snapshot.setMetricCode("products");
        snapshot.setMetricName("商品数");
        snapshot.setMetricValue(new BigDecimal("128"));
        snapshot.setUnit("COUNT");
        snapshot.setPeriodKey("2026-08");
        when(kpiSnapshotMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(snapshot));

        mockMvc.perform(post("/api/v1/decision/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"metricCode":"products"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.answer").exists())
                .andExpect(jsonPath("$.data.metricCode").value("products"));
    }

    @Test
    void testAskWithEmptyQuestion() throws Exception {
        mockMvc.perform(post("/api/v1/decision/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"","dsl":""}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("INVALID_DSL"))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void testAskWithUnknownMetric() throws Exception {
        mockMvc.perform(post("/api/v1/decision/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"metricCode":"unknown_metric_xyz"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("METRIC_NOT_ALLOWED"))
                .andExpect(jsonPath("$.message").value("metric_code not in whitelist: unknown_metric_xyz"));
    }
}
