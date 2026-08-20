package com.lingxi.sales.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.mdata.domain.DcCustomer;
import com.lingxi.mdata.infra.mapper.DcCustomerMapper;
import com.lingxi.sales.domain.SalesLead;
import com.lingxi.sales.domain.SalesOpportunity;
import com.lingxi.sales.infra.mapper.SalesLeadMapper;
import com.lingxi.sales.infra.mapper.SalesOpportunityMapper;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
    private final IdGenerator idGenerator;

    public Customer360Controller(DcCustomerMapper customerMapper,
                                  SalesLeadMapper salesLeadMapper,
                                  SalesOpportunityMapper opportunityMapper,
                                  IdGenerator idGenerator) {
        this.customerMapper = customerMapper;
        this.salesLeadMapper = salesLeadMapper;
        this.opportunityMapper = opportunityMapper;
        this.idGenerator = idGenerator;
    }

    @GetMapping("/{id}")
    @RequirePermission("sal:customer:view360")
    public Result<Map<String, Object>> customer(@PathVariable Long id) {
        return Result.ok(buildCustomer360(resolveTenantId(), id));
    }

    @GetMapping("/{id}/360")
    @RequirePermission("sal:customer:view360")
    public Result<Map<String, Object>> customer360(@PathVariable Long id) {
        return Result.ok(buildCustomer360(resolveTenantId(), id));
    }

    @PostMapping
    @RequirePermission("sal:customer:manage")
    public Result<DcCustomer> createCustomer(
            @RequestBody DcCustomer body,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {
        // TODO: implement idempotent create when X-Idempotency-Key is present
        Long tenantId = resolveTenantId();
        if (!StringUtils.hasText(body.getName())) {
            return Result.fail("BAD_REQUEST", "name is required");
        }
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("CUS"));
        }
        if (!StringUtils.hasText(body.getCustomerType())) {
            body.setCustomerType("ENTERPRISE");
        }
        customerMapper.insert(body);
        // TODO: 待事件总线基础设施就绪后发布 lx.sal.customer.created 事件
        return Result.ok(body);
    }

    private Map<String, Object> buildCustomer360(Long tenantId, Long id) {
        DcCustomer customer = customerMapper.selectOne(new LambdaQueryWrapper<DcCustomer>()
                .eq(DcCustomer::getId, id).eq(DcCustomer::getTenantId, tenantId));
        if (customer == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "customer not found");
        }
        List<SalesLead> leads = salesLeadMapper.selectList(new LambdaQueryWrapper<SalesLead>()
                .eq(SalesLead::getTenantId, tenantId).eq(SalesLead::getCustomerId, id));
        List<SalesOpportunity> opportunities = opportunityMapper.selectList(new LambdaQueryWrapper<SalesOpportunity>()
                .eq(SalesOpportunity::getTenantId, tenantId).eq(SalesOpportunity::getCustomerId, id));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("customer", customer);
        data.put("leads", leads);
        data.put("opportunities", opportunities);
        return data;
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
