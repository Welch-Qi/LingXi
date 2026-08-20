package com.lingxi.sales.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.sales.domain.SalesOpportunity;
import com.lingxi.sales.infra.mapper.SalesOpportunityMapper;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sales/opportunities")
public class OpportunityController {

    private static final List<String> STAGE_ORDER = List.of(
            "DISCOVER", "QUALIFY", "PROPOSAL", "QUOTE", "NEGOTIATE", "WON", "LOST");

    private final SalesOpportunityMapper opportunityMapper;

    public OpportunityController(SalesOpportunityMapper opportunityMapper) {
        this.opportunityMapper = opportunityMapper;
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

    @PatchMapping("/{id}/stage")
    @RequirePermission("sal:opportunity:advance")
    public Result<SalesOpportunity> advanceStage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        SalesOpportunity opp = opportunityMapper.selectOne(new LambdaQueryWrapper<SalesOpportunity>()
                .eq(SalesOpportunity::getId, id).eq(SalesOpportunity::getTenantId, tenantId));
        if (opp == null) {
            return Result.fail("NOT_FOUND", "opportunity not found");
        }
        String target = body.get("stage") == null ? null : body.get("stage").toString();
        if (!StringUtils.hasText(target)) {
            target = nextStage(opp.getStage());
        }
        if (!STAGE_ORDER.contains(target)) {
            return Result.fail("INVALID_STAGE", "unsupported stage: " + target);
        }
        opp.setStage(target);
        if (body.get("lostReason") != null) {
            opp.setLostReason(body.get("lostReason").toString());
        }
        opportunityMapper.updateById(opp);
        return Result.ok(opp);
    }

    private String nextStage(String current) {
        int idx = STAGE_ORDER.indexOf(current == null ? "DISCOVER" : current);
        if (idx < 0 || idx >= STAGE_ORDER.size() - 2) {
            return "QUOTE".equals(current) ? "NEGOTIATE" : (idx < 0 ? "QUALIFY" : current);
        }
        return STAGE_ORDER.get(idx + 1);
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
