package com.lingxi.knowledge.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.knowledge.domain.KcPrompt;
import com.lingxi.knowledge.domain.KcScript;
import com.lingxi.knowledge.domain.KcTemplate;
import com.lingxi.knowledge.infra.mapper.KcPromptMapper;
import com.lingxi.knowledge.infra.mapper.KcScriptMapper;
import com.lingxi.knowledge.infra.mapper.KcTemplateMapper;
import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.security.permission.PermissionAspect;
import com.lingxi.starter.security.permission.PermissionDecisionClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = KnowledgeController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(PermissionAspect.class)
class KnowledgeControllerTest {

    private static final long TENANT_ID = 10086L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KcTemplateMapper templateMapper;

    @MockBean
    private KcScriptMapper scriptMapper;

    @MockBean
    private KcPromptMapper promptMapper;

    @MockBean
    private IdGenerator idGenerator;

    @MockBean
    private PermissionDecisionClient permissionDecisionClient;

    @BeforeEach
    void setUp() {
        UserContext.set(new UserContext.UserPrincipal(
                "10086001", "admin", "Admin", TENANT_ID, List.of("role_admin"), DataScope.ALL, "10086001"));
        when(permissionDecisionClient.enforce(anyString(), eq(TENANT_ID), eq("kc:knowledge:manage")))
                .thenReturn(true);
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void createTemplateSuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(2001L);
        when(idGenerator.nextBizCode("TPL")).thenReturn("TPL-260820-000001");
        when(templateMapper.insert(any(KcTemplate.class))).thenReturn(1);

        mockMvc.perform(post("/api/v1/knowledge/templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Quotation Template","body":"Dear {{customer}}"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.id").value(2001))
                .andExpect(jsonPath("$.data.name").value("Quotation Template"))
                .andExpect(jsonPath("$.data.bizCode").value("TPL-260820-000001"))
                .andExpect(jsonPath("$.data.locale").value("zh-CN"));

        ArgumentCaptor<KcTemplate> captor = ArgumentCaptor.forClass(KcTemplate.class);
        verify(templateMapper).insert(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_ID);
    }

    @Test
    void listTemplatesWithPagination() throws Exception {
        KcTemplate template = new KcTemplate();
        template.setId(100L);
        template.setTenantId(TENANT_ID);
        template.setName("Quotation Template");
        Page<KcTemplate> page = new Page<>(1, 20);
        page.setRecords(List.of(template));
        page.setTotal(1);
        when(templateMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/knowledge/templates").param("pageNo", "1").param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.list[0].name").value("Quotation Template"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.pageNo").value(1))
                .andExpect(jsonPath("$.data.pageSize").value(20));
    }

    @Test
    void updateTemplateSuccess() throws Exception {
        KcTemplate existing = new KcTemplate();
        existing.setId(100L);
        existing.setTenantId(TENANT_ID);
        existing.setName("Old Name");
        existing.setBody("old body");
        when(templateMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(existing);
        when(templateMapper.updateById(any(KcTemplate.class))).thenReturn(1);

        mockMvc.perform(put("/api/v1/knowledge/templates/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Updated Template"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.name").value("Updated Template"));

        ArgumentCaptor<KcTemplate> captor = ArgumentCaptor.forClass(KcTemplate.class);
        verify(templateMapper).updateById(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Updated Template");
    }

    @Test
    void searchTemplatesByKeyword() throws Exception {
        KcTemplate template = new KcTemplate();
        template.setId(101L);
        template.setTenantId(TENANT_ID);
        template.setName("Follow-up Email");
        Page<KcTemplate> page = new Page<>(1, 20);
        page.setRecords(List.of(template));
        page.setTotal(1);
        when(templateMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/knowledge/templates").param("keyword", "Follow"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.list[0].name").value("Follow-up Email"))
                .andExpect(jsonPath("$.data.total").value(1));

        verify(templateMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
    }

    @Test
    void createScriptSuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(3001L);
        when(idGenerator.nextBizCode("SCR")).thenReturn("SCR-260820-000001");
        when(scriptMapper.insert(any(KcScript.class))).thenReturn(1);

        mockMvc.perform(post("/api/v1/knowledge/scripts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scene":"Cold Call Opening","body":"Hello, this is {{agent}} from {{company}}."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.id").value(3001))
                .andExpect(jsonPath("$.data.scene").value("Cold Call Opening"))
                .andExpect(jsonPath("$.data.bizCode").value("SCR-260820-000001"));
    }

    @Test
    void createPromptAutoGeneratesPromptCode() throws Exception {
        when(idGenerator.nextId()).thenReturn(4001L);
        when(promptMapper.insert(any(KcPrompt.class))).thenReturn(1);

        mockMvc.perform(post("/api/v1/knowledge/prompts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Sales Agent","body":"You are a helpful sales agent."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.id").value(4001))
                .andExpect(jsonPath("$.data.promptCode").value("prompt.sales.agent.v1"))
                .andExpect(jsonPath("$.data.versionLabel").value("v1"));
    }

    @Test
    void createTemplateMissingNameReturnsError() throws Exception {
        mockMvc.perform(post("/api/v1/knowledge/templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"body":"content without name"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("name and body are required"));
    }

    @Test
    void listPromptsWithPagination() throws Exception {
        KcPrompt prompt = new KcPrompt();
        prompt.setId(500L);
        prompt.setTenantId(TENANT_ID);
        prompt.setName("Market Analyst");
        prompt.setPromptCode("prompt.market.analyst.v1");
        Page<KcPrompt> page = new Page<>(1, 20);
        page.setRecords(List.of(prompt));
        page.setTotal(1);
        when(promptMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/knowledge/prompts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.list[0].promptCode").value("prompt.market.analyst.v1"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.pageNo").value(1))
                .andExpect(jsonPath("$.data.pageSize").value(20));
    }
}
