package com.lingxi.sales.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.sales.domain.SalesOpportunity;
import com.lingxi.sales.infra.mapper.SalesOpportunityMapper;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sales/opportunities")
public class OpportunityController {

    private final SalesOpportunityMapper opportunityMapper;
    private final IdGenerator idGenerator;

    public OpportunityController(SalesOpportunityMapper opportunityMapper, IdGenerator idGenerator) {
        this.opportunityMapper = opportunityMapper;
        this.idGenerator = idGenerator;
    }

    @GetMapping
    @RequirePermission("sal:lead:view")
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize) {
        Long tenantId = resolveTenantId();
        Page<SalesOpportunity> page = opportunityMapper.selectPage(
                new Page<>(pageNo, pageSize),
                new LambdaQueryWrapper<SalesOpportunity>()
                        .eq(SalesOpportunity::getTenantId, tenantId)
                        .orderByDesc(SalesOpportunity::getId));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNo", page.getCurrent());
        data.put("pageSize", page.getSize());
        return Result.ok(data);
    }

    @GetMapping("/{id}")
    @RequirePermission("sal:lead:view")
    public Result<SalesOpportunity> detail(@PathVariable Long id) {
        return Result.ok(requireOpportunity(resolveTenantId(), id));
    }

    @PostMapping
    @RequirePermission("sal:opportunity:advance")
    public Result<SalesOpportunity> create(@RequestBody SalesOpportunity body) {
        Long tenantId = resolveTenantId();
        if (!StringUtils.hasText(body.getName())) {
            return Result.fail("BAD_REQUEST", "name is required");
        }
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("OPP"));
        }
        if (!StringUtils.hasText(body.getStage())) {
            body.setStage("DISCOVER");
        }
        if (!StringUtils.hasText(body.getCurrency())) {
            body.setCurrency("USD");
        }
        opportunityMapper.insert(body);
        return Result.ok(body);
    }

    @PatchMapping("/{id}/stage")
    @RequirePermission("sal:opportunity:advance")
    public Result<SalesOpportunity> advanceStage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        SalesOpportunity opp = requireOpportunity(tenantId, id);
        String target = body.get("stage") == null ? null : body.get("stage").toString();
        if (!StringUtils.hasText(target)) {
            target = SalesOpportunity.nextStage(opp.getStage());
        }
        try {
            opp.advanceTo(target);
        } catch (IllegalArgumentException ex) {
            return Result.fail("INVALID_STAGE", ex.getMessage());
        }
        if (body.get("lostReason") != null) {
            opp.setLostReason(body.get("lostReason").toString());
        }
        opportunityMapper.updateById(opp);
        // TODO: 待事件总线基础设施就绪后发布 lx.sal.opportunity.stage_changed 事件
        return Result.ok(opp);
    }

    private SalesOpportunity requireOpportunity(Long tenantId, Long id) {
        SalesOpportunity opp = opportunityMapper.selectOne(new LambdaQueryWrapper<SalesOpportunity>()
                .eq(SalesOpportunity::getId, id).eq(SalesOpportunity::getTenantId, tenantId));
        if (opp == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "opportunity not found");
        }
        return opp;
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
