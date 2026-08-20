package com.lingxi.market.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.market.domain.MktHotKeyword;
import com.lingxi.market.domain.MktOpportunity;
import com.lingxi.market.domain.MktSearchTrend;
import com.lingxi.market.domain.RegionHeatView;
import com.lingxi.market.infra.mapper.MktHotKeywordMapper;
import com.lingxi.market.infra.mapper.MktOpportunityMapper;
import com.lingxi.market.infra.mapper.MktSearchTrendMapper;
import com.lingxi.starter.core.config.LingxiCoreAutoConfiguration;
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
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MarketController.class)
@AutoConfigureMockMvc(addFilters = false)
@EnableAspectJAutoProxy
@Import({PermissionAspect.class, LingxiCoreAutoConfiguration.class})
class MarketControllerTest {

    private static final Long TENANT_ID = 10086L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MktSearchTrendMapper trendMapper;

    @MockBean
    private MktHotKeywordMapper keywordMapper;

    @MockBean
    private MktOpportunityMapper opportunityMapper;

    @MockBean
    private PermissionDecisionClient permissionDecisionClient;

    @BeforeEach
    void setUp() {
        UserContext.set(new UserContext.UserPrincipal(
                "10086001", "admin", "Admin", TENANT_ID, List.of("role_admin"), DataScope.ALL, "10086001"));
        when(permissionDecisionClient.enforce(anyString(), eq(TENANT_ID), anyString())).thenReturn(true);
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void searchTrendsReturnsPaginatedData() throws Exception {
        MktSearchTrend trend = sampleSearchTrend();
        Page<MktSearchTrend> page = new Page<>(1, 20);
        page.setRecords(List.of(trend));
        page.setTotal(1);
        when(trendMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/market/search-trends"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.pageNo").value(1))
                .andExpect(jsonPath("$.data.pageSize").value(20))
                .andExpect(jsonPath("$.data.list[0].keyword").value("balcony solar battery"));
    }

    @Test
    void searchTrendsFiltersByKeyword() throws Exception {
        Page<MktSearchTrend> page = new Page<>(1, 20);
        page.setRecords(List.of(sampleSearchTrend()));
        page.setTotal(1);
        when(trendMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/market/search-trends").param("keyword", "balcony solar battery"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.list[0].keyword").value("balcony solar battery"));

        verify(trendMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
    }

    @Test
    void hotKeywordsReturnsOrderedByHeatScore() throws Exception {
        MktHotKeyword high = sampleHotKeyword(10086701L, "balcony solar battery", 92, "UP");
        MktHotKeyword low = sampleHotKeyword(10086703L, "portable power station", 76, "FLAT");
        Page<MktHotKeyword> page = new Page<>(1, 20);
        page.setRecords(List.of(high, low));
        page.setTotal(2);
        when(keywordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/market/hot-keywords"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.list[0].heatScore").value(92))
                .andExpect(jsonPath("$.data.list[1].heatScore").value(76));
    }

    @Test
    void risingKeywordsReturnsOnlyRisingTrend() throws Exception {
        MktHotKeyword rising = sampleHotKeyword(10086701L, "balcony solar battery", 92, "UP");
        Page<MktHotKeyword> page = new Page<>(1, 20);
        page.setRecords(List.of(rising));
        page.setTotal(1);
        when(keywordMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/market/rising-keywords"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.list[0].trend").value("UP"))
                .andExpect(jsonPath("$.data.list[0].keyword").value("balcony solar battery"));
    }

    @Test
    void regionHeatReturnsAggregatedResults() throws Exception {
        RegionHeatView de = new RegionHeatView();
        de.setRegion("DE");
        de.setHeatValue(77);
        de.setTrendCount(3L);
        RegionHeatView es = new RegionHeatView();
        es.setRegion("ES");
        es.setHeatValue(71);
        es.setTrendCount(1L);
        when(trendMapper.aggregateRegionHeat(eq(TENANT_ID), eq(null))).thenReturn(List.of(de, es));

        mockMvc.perform(get("/api/v1/market/region-heat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(2))
                .andExpect(jsonPath("$.data.list[0].region").value("DE"))
                .andExpect(jsonPath("$.data.list[0].heatValue").value(77))
                .andExpect(jsonPath("$.data.list[0].trendCount").value(3))
                .andExpect(jsonPath("$.data.list[1].region").value("ES"));
    }

    @Test
    void opportunitiesReturnsOrderedByScore() throws Exception {
        MktOpportunity opp = sampleOpportunity();
        when(opportunityMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(opp));

        mockMvc.perform(get("/api/v1/market/opportunities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].score").value(91))
                .andExpect(jsonPath("$.data[0].title").value("德国阳台储能上升机会"));

        verify(opportunityMapper).selectList(any(LambdaQueryWrapper.class));
    }

    @Test
    void searchTrendsForbiddenWhenNoPermission() throws Exception {
        when(permissionDecisionClient.enforce(anyString(), eq(TENANT_ID), eq("mkt:trend:view")))
                .thenReturn(false);

        mockMvc.perform(get("/api/v1/market/search-trends"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("403"));
    }

    @Test
    void searchTrendsUsesDefaultPagination() throws Exception {
        Page<MktSearchTrend> page = new Page<>(1, 20);
        page.setRecords(List.of(sampleSearchTrend()));
        page.setTotal(1);
        when(trendMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/market/search-trends"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pageNo").value(1))
                .andExpect(jsonPath("$.data.pageSize").value(20));

        verify(trendMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
    }

    private static MktSearchTrend sampleSearchTrend() {
        MktSearchTrend trend = new MktSearchTrend();
        trend.setId(10086803L);
        trend.setTenantId(TENANT_ID);
        trend.setKeyword("balcony solar battery");
        trend.setRegion("DE");
        trend.setMetricDate(LocalDate.now());
        trend.setIndexValue(92);
        return trend;
    }

    private static MktHotKeyword sampleHotKeyword(Long id, String keyword, int heatScore, String trend) {
        MktHotKeyword item = new MktHotKeyword();
        item.setId(id);
        item.setTenantId(TENANT_ID);
        item.setKeyword(keyword);
        item.setCategory("储能");
        item.setRegion("DE");
        item.setHeatScore(heatScore);
        item.setTrend(trend);
        return item;
    }

    private static MktOpportunity sampleOpportunity() {
        MktOpportunity opp = new MktOpportunity();
        opp.setId(10086901L);
        opp.setTenantId(TENANT_ID);
        opp.setBizCode("MKT-OPP-01");
        opp.setTitle("德国阳台储能上升机会");
        opp.setProductHint("P2000");
        opp.setTargetMarket("DE");
        opp.setScore(91);
        opp.setSummary("搜索指数两周上升约30%，建议社媒内容+线索跟进");
        opp.setStatus("OPEN");
        return opp;
    }
}
