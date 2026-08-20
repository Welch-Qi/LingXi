package com.lingxi.config.app;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingxi.config.domain.CcIndustry;
import com.lingxi.config.domain.CcPermission;
import com.lingxi.config.domain.CcRole;
import com.lingxi.config.domain.CcUser;
import com.lingxi.config.infra.mapper.CcIndustryMapper;
import com.lingxi.config.infra.mapper.CcPermissionMapper;
import com.lingxi.config.infra.mapper.CcRoleMapper;
import com.lingxi.config.infra.mapper.CcSettingMapper;
import com.lingxi.config.infra.mapper.CcUserMapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ConfigController.class)
@AutoConfigureMockMvc(addFilters = false)
class ConfigControllerTest {

    private static final Long TENANT_ID = 10086L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CcIndustryMapper industryMapper;

    @MockBean
    private CcSettingMapper settingMapper;

    @MockBean
    private CcUserMapper userMapper;

    @MockBean
    private CcRoleMapper roleMapper;

    @MockBean
    private CcPermissionMapper permissionMapper;

    @MockBean
    private IdGenerator idGenerator;

    @BeforeEach
    void setUp() {
        UserContext.set(new UserContext.UserPrincipal(
                "10086001", "admin", "Admin", TENANT_ID, List.of("role_admin"), DataScope.ALL, "10086001"));
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void listIndustriesUsesPluralPath() throws Exception {
        CcIndustry industry = new CcIndustry();
        industry.setId(1L);
        industry.setTenantId(TENANT_ID);
        industry.setIndustryCode("MFG");
        industry.setIndustryName("制造业");
        when(industryMapper.selectList(any())).thenReturn(List.of(industry));

        mockMvc.perform(get("/api/v1/config/industries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data[0].industryCode").value("MFG"))
                .andExpect(jsonPath("$.data[0].industryName").value("制造业"));
    }

    @Test
    void updateIndustriesReplacesTenantRows() throws Exception {
        when(idGenerator.nextId()).thenReturn(9001L, 9002L);
        when(industryMapper.selectList(any())).thenReturn(List.of());

        mockMvc.perform(put("/api/v1/config/industries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  {"industryCode":"MFG","industryName":"制造业"},
                                  {"industryCode":"RET","industryName":"零售业"}
                                ]
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"));

        verify(industryMapper).delete(any());
        verify(industryMapper, org.mockito.Mockito.times(2)).insert(any(CcIndustry.class));
    }

    @Test
    void createUserSuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(8001L);
        when(idGenerator.nextBizCode("USR")).thenReturn("USR-001");

        mockMvc.perform(post("/api/v1/config/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"张三","email":"zhang@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.bizCode").value("USR-001"))
                .andExpect(jsonPath("$.data.email").value("zhang@example.com"));

        ArgumentCaptor<CcUser> captor = ArgumentCaptor.forClass(CcUser.class);
        verify(userMapper).insert(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_ID);
        assertThat(captor.getValue().getIsActive()).isTrue();
    }

    @Test
    void listUsersReturnsPagedResult() throws Exception {
        CcUser user = new CcUser();
        user.setId(8001L);
        user.setTenantId(TENANT_ID);
        user.setBizCode("USR-001");
        user.setDisplayName("张三");
        user.setEmail("zhang@example.com");
        Page<CcUser> page = new Page<>(1, 20);
        page.setRecords(List.of(user));
        page.setTotal(1);
        when(userMapper.selectPage(any(Page.class), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/config/users").param("pageNo", "1").param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.list[0].bizCode").value("USR-001"));
    }

    @Test
    void updateUserSuccess() throws Exception {
        CcUser existing = new CcUser();
        existing.setId(8001L);
        existing.setTenantId(TENANT_ID);
        existing.setBizCode("USR-001");
        existing.setDisplayName("张三");
        existing.setEmail("zhang@example.com");
        when(userMapper.selectOne(any())).thenReturn(existing);

        mockMvc.perform(put("/api/v1/config/users/8001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"李四","department":"销售部"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.displayName").value("李四"))
                .andExpect(jsonPath("$.data.department").value("销售部"));

        verify(userMapper).updateById(existing);
    }

    @Test
    void createRoleSuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(7001L);
        when(idGenerator.nextBizCode("ROL")).thenReturn("ROL-001");

        mockMvc.perform(post("/api/v1/config/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"销售经理","description":"销售域管理员"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.bizCode").value("ROL-001"))
                .andExpect(jsonPath("$.data.name").value("销售经理"));

        ArgumentCaptor<CcRole> captor = ArgumentCaptor.forClass(CcRole.class);
        verify(roleMapper).insert(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(TENANT_ID);
    }

    @Test
    void listRolesReturnsPagedResult() throws Exception {
        CcRole role = new CcRole();
        role.setId(7001L);
        role.setTenantId(TENANT_ID);
        role.setBizCode("ROL-001");
        role.setName("销售经理");
        Page<CcRole> page = new Page<>(1, 20);
        page.setRecords(List.of(role));
        page.setTotal(1);
        when(roleMapper.selectPage(any(Page.class), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/config/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.list[0].name").value("销售经理"));
    }

    @Test
    void listPermissionsReturnsTreeNodes() throws Exception {
        CcPermission root = new CcPermission();
        root.setId(6001L);
        root.setTenantId(TENANT_ID);
        root.setPermissionCode("sal:lead:view");
        root.setName("线索查看");
        root.setSortOrder(1);
        CcPermission child = new CcPermission();
        child.setId(6002L);
        child.setTenantId(TENANT_ID);
        child.setPermissionCode("sal:lead:create");
        child.setName("线索创建");
        child.setParentId(6001L);
        child.setSortOrder(2);
        when(permissionMapper.selectList(any())).thenReturn(List.of(root, child));

        mockMvc.perform(get("/api/v1/config/permissions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data[0].permissionCode").value("sal:lead:view"))
                .andExpect(jsonPath("$.data[1].parentId").value(6001));
    }

    @Test
    void createUserMissingEmailReturnsError() throws Exception {
        mockMvc.perform(post("/api/v1/config/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"张三"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("email is required"));
    }

    @Test
    void createRoleMissingNameReturnsError() throws Exception {
        mockMvc.perform(post("/api/v1/config/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description":"无名称角色"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("name is required"));
    }
}
