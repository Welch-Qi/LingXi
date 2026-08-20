package com.lingxi.sales.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.sales.domain.SalesLead;
import com.lingxi.sales.domain.SalesLeadFollow;
import com.lingxi.sales.domain.SalesOpportunity;
import com.lingxi.sales.infra.mapper.SalesLeadFollowMapper;
import com.lingxi.sales.infra.mapper.SalesLeadMapper;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = LeadController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class LeadControllerTest {

    private static final Long TENANT_ID = 10086L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SalesLeadMapper salesLeadMapper;

    @MockBean
    private SalesLeadFollowMapper followMapper;

    @MockBean
    private LeadDedupService leadDedupService;

    @MockBean
    private IdGenerator idGenerator;

    @MockBean
    private JdbcTemplate jdbcTemplate;

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
    void getLeadDetailReturnsData() throws Exception {
        SalesLead lead = sampleLead();
        when(salesLeadMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(lead);
        when(followMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);
        when(followMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        mockMvc.perform(get("/api/v1/sales/leads/8001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.lead.id").value(8001))
                .andExpect(jsonPath("$.data.lead.companyName").value("Acme Corp"))
                .andExpect(jsonPath("$.data.followCount").value(2));
    }

    @Test
    void getLeadDetailNotFound() throws Exception {
        when(salesLeadMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        mockMvc.perform(get("/api/v1/sales/leads/9999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("404"))
                .andExpect(jsonPath("$.message").value("lead not found"));
    }

    @Test
    void assignLeadSuccess() throws Exception {
        SalesLead lead = sampleLead();
        lead.setStatus("POOL");
        when(salesLeadMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(lead);
        when(salesLeadMapper.updateById(any(SalesLead.class))).thenReturn(1);

        mockMvc.perform(post("/api/v1/sales/leads/8001/assignment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"ownerUserId":20001}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.data.ownerUserId").value(20001));

        verify(salesLeadMapper).updateById(any(SalesLead.class));
    }

    @Test
    void createLeadBlockedByDedup() throws Exception {
        Map<String, Object> dedup = new LinkedHashMap<>();
        dedup.put("hasDuplicate", true);
        dedup.put("count", 1);
        when(leadDedupService.check(eq(TENANT_ID), any())).thenReturn(dedup);

        mockMvc.perform(post("/api/v1/sales/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"companyName":"Acme Corp","email":"info@acme.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.created").value(false))
                .andExpect(jsonPath("$.data.dedup.hasDuplicate").value(true));

        verify(salesLeadMapper, never()).insert(any(SalesLead.class));
    }

    private static SalesLead sampleLead() {
        SalesLead lead = new SalesLead();
        lead.setId(8001L);
        lead.setTenantId(TENANT_ID);
        lead.setBizCode("LEAD-260820-000001");
        lead.setCompanyName("Acme Corp");
        lead.setEmail("info@acme.com");
        lead.setStatus("NEW");
        return lead;
    }
}
