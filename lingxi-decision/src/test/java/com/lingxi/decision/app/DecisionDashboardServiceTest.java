package com.lingxi.decision.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingxi.decision.domain.DmKpiSnapshot;
import com.lingxi.decision.infra.mapper.DmKpiSnapshotMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DecisionDashboardServiceTest {

    private static final long TENANT_ID = 10086L;

    @Mock
    private DmKpiSnapshotMapper kpiSnapshotMapper;

    private DecisionDashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DecisionDashboardService(kpiSnapshotMapper, new ObjectMapper());
    }

    @Test
    void testBuildDashboardWithKpiData() {
        DmKpiSnapshot products = snapshot("products", "商品数", "2026-08", new BigDecimal("120"));
        DmKpiSnapshot productsDay = snapshot("products", "商品数", "2026-08-20", new BigDecimal("5"));
        DmKpiSnapshot orders = snapshot("order", "订单量", "2026-08", new BigDecimal("42"));
        when(kpiSnapshotMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(products, productsDay, orders));

        Map<String, Object> dashboard = dashboardService.buildDashboard(TENANT_ID);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> kpiCards = (List<Map<String, Object>>) dashboard.get("kpis");
        assertThat(kpiCards).isNotNull().isNotEmpty();
        assertThat(kpiCards.stream().map(card -> card.get("key"))).contains("products", "order");
    }

    @Test
    void testBuildDashboardWithEmptyData() {
        when(kpiSnapshotMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of());

        Map<String, Object> dashboard = dashboardService.buildDashboard(TENANT_ID);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> kpiCards = (List<Map<String, Object>>) dashboard.get("kpis");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> funnel = (List<Map<String, Object>>) dashboard.get("funnel");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> trend = (List<Map<String, Object>>) dashboard.get("trend");

        assertThat(kpiCards).isNotNull();
        assertThat(funnel).isNotNull().isNotEmpty();
        assertThat(trend).isNotNull().isEmpty();
        assertThat(dashboard.get("countryHeat")).isNotNull();
    }

    @Test
    void testAskQuestionWithKnownMetric() {
        DmKpiSnapshot snapshot = snapshot("products", "商品数", "2026-08", new BigDecimal("256"));
        when(kpiSnapshotMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(snapshot));

        Map<String, Object> result = dashboardService.askQuestion(TENANT_ID, "products");

        assertThat(result.get("metricCode")).isEqualTo("products");
        assertThat(result.get("value")).isEqualTo(new BigDecimal("256"));
        assertThat(String.valueOf(result.get("answer"))).contains("商品数").contains("256");
    }

    @Test
    void testAskQuestionWithUnknownMetric() {
        Map<String, Object> result = dashboardService.askQuestion(TENANT_ID, "not_a_real_metric");

        assertThat(result.get("metricCode")).isEqualTo("not_a_real_metric");
        assertThat(String.valueOf(result.get("answer"))).contains("未知指标");
    }

    private static DmKpiSnapshot snapshot(String code, String name, String periodKey, BigDecimal value) {
        DmKpiSnapshot snapshot = new DmKpiSnapshot();
        snapshot.setMetricCode(code);
        snapshot.setMetricName(name);
        snapshot.setPeriodKey(periodKey);
        snapshot.setMetricValue(value);
        snapshot.setUnit("COUNT");
        return snapshot;
    }
}
