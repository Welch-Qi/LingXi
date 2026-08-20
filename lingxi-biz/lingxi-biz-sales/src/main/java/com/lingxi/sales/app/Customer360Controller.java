package com.lingxi.sales.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.mdata.domain.DcCustomer;
import com.lingxi.mdata.infra.mapper.DcCustomerMapper;
import com.lingxi.sales.domain.SalesLead;
import com.lingxi.sales.domain.SalesOpportunity;
import com.lingxi.sales.infra.mapper.SalesLeadMapper;
import com.lingxi.sales.infra.mapper.SalesOpportunityMapper;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sales/customers")
public class Customer360Controller {

    private final DcCustomerMapper customerMapper;
    private final SalesLeadMapper salesLeadMapper;
    private final SalesOpportunityMapper opportunityMapper;

    public Customer360Controller(DcCustomerMapper customerMapper,
                                  SalesLeadMapper salesLeadMapper,
                                  SalesOpportunityMapper opportunityMapper) {
        this.customerMapper = customerMapper;
        this.salesLeadMapper = salesLeadMapper;
        this.opportunityMapper = opportunityMapper;
    }

    @GetMapping("/{id}/360")
    @RequirePermission("sal:customer:view360")
    public Result<Map<String, Object>> customer360(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        DcCustomer customer = customerMapper.selectOne(new LambdaQueryWrapper<DcCustomer>()
                .eq(DcCustomer::getId, id).eq(DcCustomer::getTenantId, tenantId));
        List<SalesLead> leads = salesLeadMapper.selectList(new LambdaQueryWrapper<SalesLead>()
                .eq(SalesLead::getTenantId, tenantId).eq(SalesLead::getCustomerId, id));
        List<SalesOpportunity> opportunities = opportunityMapper.selectList(new LambdaQueryWrapper<SalesOpportunity>()
                .eq(SalesOpportunity::getTenantId, tenantId).eq(SalesOpportunity::getCustomerId, id));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("customer", customer);
        data.put("leads", leads);
        data.put("opportunities", opportunities);
        return Result.ok(data);
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
