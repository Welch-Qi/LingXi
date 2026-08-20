package com.lingxi.marketing.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.marketing.domain.MkgContentAsset;
import com.lingxi.marketing.domain.MkgSocialAccount;
import com.lingxi.marketing.infra.mapper.MkgCampaignMapper;
import com.lingxi.marketing.infra.mapper.MkgContentAssetMapper;
import com.lingxi.marketing.infra.mapper.MkgPublishJobMapper;
import com.lingxi.marketing.infra.mapper.MkgSocialAccountMapper;
import com.lingxi.starter.core.exception.GlobalExceptionHandler;
import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MarketingController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class MarketingControllerTest {

    private static final Long TENANT_ID = 10086L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MkgSocialAccountMapper socialAccountMapper;

    @MockBean
    private MkgContentAssetMapper contentAssetMapper;

    @MockBean
    private MkgCampaignMapper campaignMapper;

    @MockBean
    private MkgPublishJobMapper publishJobMapper;

    @MockBean
    private IdGenerator idGenerator;

    @MockBean
    private ContentAgentClient contentAgentClient;

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
    void listSocialAccounts() throws Exception {
        when(socialAccountMapper.selectList(any(LambdaQueryWrapper.class)))
                .thenReturn(List.of(sampleSocialAccount()));

        mockMvc.perform(get("/api/v1/marketing/social-accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data[0].platform").value("INSTAGRAM"))
                .andExpect(jsonPath("$.data[0].accountName").value("@novatech.global"));

        verify(socialAccountMapper).selectList(any(LambdaQueryWrapper.class));
    }

    @Test
    void bindSocialAccountSuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(9301L);

        mockMvc.perform(post("/api/v1/marketing/social-accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"platform":"FACEBOOK","accountName":"@novatech.fb"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.platform").value("FACEBOOK"))
                .andExpect(jsonPath("$.data.accountName").value("@novatech.fb"))
                .andExpect(jsonPath("$.data.authStatus").value("DISCONNECTED"));

        ArgumentCaptor<MkgSocialAccount> captor = ArgumentCaptor.forClass(MkgSocialAccount.class);
        verify(socialAccountMapper).insert(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_ID);
        assertThat(captor.getValue().getId()).isEqualTo(9301L);
    }

    @Test
    void bindSocialAccountInvalidPlatform() throws Exception {
        mockMvc.perform(post("/api/v1/marketing/social-accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"platform":"TWITTER","accountName":"@novatech"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("invalid platform: TWITTER"));
    }

    @Test
    void bindSocialAccountMissingAccountName() throws Exception {
        mockMvc.perform(post("/api/v1/marketing/social-accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"platform":"INSTAGRAM"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("accountName is required"));
    }

    @Test
    void unbindSocialAccountSuccess() throws Exception {
        when(socialAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(sampleSocialAccount());
        when(socialAccountMapper.deleteById(anyLong())).thenReturn(1);

        mockMvc.perform(delete("/api/v1/marketing/social-accounts/9301"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"));

        verify(socialAccountMapper).deleteById(9301L);
    }

    @Test
    void unbindSocialAccountNotFound() throws Exception {
        when(socialAccountMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

        mockMvc.perform(delete("/api/v1/marketing/social-accounts/9999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("404"))
                .andExpect(jsonPath("$.message").value("social account not found"));
    }

    @Test
    void aiContentGenerateSuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(9401L);
        when(idGenerator.nextBizCode("CT")).thenReturn("CT-260820-000001");
        when(contentAgentClient.generate(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(agentSuccess("Agent generated draft content"));

        mockMvc.perform(post("/api/v1/marketing/ai-content")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"contentType":"TEXT","topic":"阳台储能推广","locale":"zh-CN"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.generatedBy").value("social_marketer"))
                .andExpect(jsonPath("$.data.asset.title").value("阳台储能推广"))
                .andExpect(jsonPath("$.data.asset.body").value("Agent generated draft content"));

        verify(contentAssetMapper).insert(any(MkgContentAsset.class));
    }

    @Test
    void aiContentLocalFallbackWhenAgentFails() throws Exception {
        when(idGenerator.nextId()).thenReturn(9402L);
        when(idGenerator.nextBizCode("CT")).thenReturn("CT-260820-000002");
        Map<String, Object> agentFailure = new LinkedHashMap<>();
        agentFailure.put("ok", false);
        agentFailure.put("status", "runtime_unavailable");
        when(contentAgentClient.generate(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(agentFailure);

        mockMvc.perform(post("/api/v1/marketing/ai-content")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"contentType":"VIDEO","topic":"海外储能方案","keywords":"energy,storage"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.generatedBy").value("local_fallback"))
                .andExpect(jsonPath("$.data.agentStatus").value("runtime_unavailable"))
                .andExpect(jsonPath("$.data.asset.contentType").value("VIDEO"))
                .andExpect(jsonPath("$.data.asset.body").value(org.hamcrest.Matchers.containsString("local_fallback")));

        ArgumentCaptor<MkgContentAsset> captor = ArgumentCaptor.forClass(MkgContentAsset.class);
        verify(contentAssetMapper).insert(captor.capture());
        assertThat(captor.getValue().getBody()).contains("local_fallback");
    }

    private static MkgSocialAccount sampleSocialAccount() {
        MkgSocialAccount account = new MkgSocialAccount();
        account.setId(9301L);
        account.setTenantId(TENANT_ID);
        account.setPlatform("INSTAGRAM");
        account.setAccountName("@novatech.global");
        account.setAuthStatus("CONNECTED");
        return account;
    }

    private static Map<String, Object> agentSuccess(String draft) {
        Map<String, Object> agent = new LinkedHashMap<>();
        agent.put("ok", true);
        agent.put("draft", draft);
        agent.put("status", "completed");
        agent.put("source", "social_marketer");
        return agent;
    }
}
