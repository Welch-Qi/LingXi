package com.lingxi.mdata.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.mdata.domain.DcCustomer;
import com.lingxi.mdata.domain.DcEmployee;
import com.lingxi.mdata.domain.DcProduct;
import com.lingxi.mdata.infra.mapper.DcChannelMapper;
import com.lingxi.mdata.infra.mapper.DcCustomerMapper;
import com.lingxi.mdata.infra.mapper.DcEmployeeMapper;
import com.lingxi.mdata.infra.mapper.DcProductMapper;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MdataController.class)
@AutoConfigureMockMvc(addFilters = false)
class MdataControllerTest {

    private static final Long TENANT_ID = 10086L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DcCustomerMapper customerMapper;

    @MockBean
    private DcProductMapper productMapper;

    @MockBean
    private DcChannelMapper channelMapper;

    @MockBean
    private DcEmployeeMapper employeeMapper;

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
    void createCustomerSuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(9001L);
        when(idGenerator.nextBizCode("CUS")).thenReturn("CUS-260820-000001");

        mockMvc.perform(post("/api/v1/mdata/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"NovaTech GmbH","country":"DE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.name").value("NovaTech GmbH"))
                .andExpect(jsonPath("$.data.bizCode").value("CUS-260820-000001"));

        verify(customerMapper).insert(any(DcCustomer.class));
    }

    @Test
    void listCustomersPagination() throws Exception {
        DcCustomer customer = sampleCustomer();
        Page<DcCustomer> page = new Page<>(1, 20);
        page.setRecords(List.of(customer));
        page.setTotal(1);
        when(customerMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/mdata/customers").param("pageNo", "1").param("pageSize", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.total").value(1))
                .andExpect(jsonPath("$.data.pageNo").value(1))
                .andExpect(jsonPath("$.data.pageSize").value(20))
                .andExpect(jsonPath("$.data.list[0].name").value("NovaTech GmbH"));
    }

    @Test
    void getCustomerDetail() throws Exception {
        DcCustomer customer = sampleCustomer();
        when(customerMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(customer);

        mockMvc.perform(get("/api/v1/mdata/customers/9001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(9001))
                .andExpect(jsonPath("$.data.name").value("NovaTech GmbH"));
    }

    @Test
    void patchCustomerPartialUpdate() throws Exception {
        DcCustomer existing = sampleCustomer();
        when(customerMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(existing);
        when(customerMapper.updateById(any(DcCustomer.class))).thenReturn(1);

        mockMvc.perform(patch("/api/v1/mdata/customers/9001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"country":"US"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.country").value("US"))
                .andExpect(jsonPath("$.data.name").value("NovaTech GmbH"));

        ArgumentCaptor<DcCustomer> captor = ArgumentCaptor.forClass(DcCustomer.class);
        verify(customerMapper).updateById(captor.capture());
        assertThat(captor.getValue().getCountry()).isEqualTo("US");
    }

    @Test
    void createProductSuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(9101L);
        when(idGenerator.nextBizCode("PRD")).thenReturn("PRD-260820-000001");

        mockMvc.perform(post("/api/v1/mdata/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sku":"SKU-001","brand":"NovaTech"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.sku").value("SKU-001"))
                .andExpect(jsonPath("$.data.bizCode").value("PRD-260820-000001"));

        verify(productMapper).insert(any(DcProduct.class));
    }

    @Test
    void createEmployeeSuccess() throws Exception {
        when(idGenerator.nextId()).thenReturn(9201L);
        when(idGenerator.nextBizCode("EMP")).thenReturn("EMP-260820-000001");

        mockMvc.perform(post("/api/v1/mdata/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Alice Chen","department":"Sales"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.name").value("Alice Chen"))
                .andExpect(jsonPath("$.data.bizCode").value("EMP-260820-000001"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));

        verify(employeeMapper).insert(any(DcEmployee.class));
    }

    @Test
    void keywordSearchCustomers() throws Exception {
        Page<DcCustomer> page = new Page<>(1, 20);
        page.setRecords(List.of(sampleCustomer()));
        page.setTotal(1);
        when(customerMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/mdata/customers").param("keyword", "Nova"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.list[0].name").value("NovaTech GmbH"));

        verify(customerMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
    }

    @Test
    void createEmployeeMissingNameReturnsError() throws Exception {
        mockMvc.perform(post("/api/v1/mdata/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"department":"Sales"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("name is required"));
    }

    private static DcCustomer sampleCustomer() {
        DcCustomer customer = new DcCustomer();
        customer.setId(9001L);
        customer.setTenantId(TENANT_ID);
        customer.setBizCode("CUS-260820-000001");
        customer.setName("NovaTech GmbH");
        customer.setCustomerType("ENTERPRISE");
        customer.setCountry("DE");
        return customer;
    }
}
