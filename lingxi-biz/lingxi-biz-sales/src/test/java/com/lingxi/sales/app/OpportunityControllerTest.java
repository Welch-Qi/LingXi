package com.lingxi.sales.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.sales.domain.SalesOpportunity;
import com.lingxi.sales.infra.mapper.SalesOpportunityMapper;
import com.lingxi.starter.core.exception.GlobalExceptionHandler;
import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = OpportunityController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class OpportunityControllerTest {

    private static final Long TENANT_ID = 10086L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SalesOpportunityMapper opportunityMapper;

    @MockBean
    private IdGenerator idGenerator;

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
    void createOpportunitySuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(8101L);
        when(idGenerator.nextBizCode("OPP")).thenReturn("OPP-260820-000001");

        mockMvc.perform(post("/api/v1/sales/opportunities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Q4 Deal","customerId":9001,"amountMinor":500000,"currency":"USD"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.bizCode").value("OPP-260820-000001"))
                .andExpect(jsonPath("$.data.stage").value("DISCOVER"));

        verify(opportunityMapper).insert(any(SalesOpportunity.class));
    }

    @Test
    void getOpportunityDetail() throws Exception {
        SalesOpportunity opp = sampleOpportunity("DISCOVER");
        when(opportunityMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(opp);

        mockMvc.perform(get("/api/v1/sales/opportunities/8101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.id").value(8101))
                .andExpect(jsonPath("$.data.name").value("Q4 Deal"));
    }

    @Test
    void listOpportunitiesPagination() throws Exception {
        Page<SalesOpportunity> page = new Page<>(1, 20);
        page.setRecords(List.of(sampleOpportunity("DISCOVER")));
        page.setTotal(1);
        when(opportunityMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/sales/opportunities").param("pageNo", "1").param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.list[0].name").value("Q4 Deal"));
    }

    @Test
    void advanceStageSuccess() throws Exception {
        SalesOpportunity opp = sampleOpportunity("DISCOVER");
        when(opportunityMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(opp);
        when(opportunityMapper.updateById(any(SalesOpportunity.class))).thenReturn(1);

        mockMvc.perform(patch("/api/v1/sales/opportunities/8101/stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"stage":"QUALIFY"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.stage").value("QUALIFY"));

        verify(opportunityMapper).updateById(any(SalesOpportunity.class));
    }

    @Test
    void invalidStageTransitionRejected() throws Exception {
        SalesOpportunity opp = sampleOpportunity("WON");
        when(opportunityMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(opp);

        mockMvc.perform(patch("/api/v1/sales/opportunities/8101/stage")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"stage":"NEGOTIATE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("INVALID_STAGE"));
    }

    private static SalesOpportunity sampleOpportunity(String stage) {
        SalesOpportunity opp = new SalesOpportunity();
        opp.setId(8101L);
        opp.setTenantId(TENANT_ID);
        opp.setBizCode("OPP-260820-000001");
        opp.setName("Q4 Deal");
        opp.setCustomerId(9001L);
        opp.setStage(stage);
        opp.setAmountMinor(500000L);
        opp.setCurrency("USD");
        return opp;
    }
}
