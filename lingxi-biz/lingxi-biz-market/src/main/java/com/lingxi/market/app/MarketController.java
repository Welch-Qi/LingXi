package com.lingxi.market.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.market.domain.MktHotKeyword;
import com.lingxi.market.domain.MktOpportunity;
import com.lingxi.market.domain.MktSearchTrend;
import com.lingxi.market.infra.mapper.MktHotKeywordMapper;
import com.lingxi.market.infra.mapper.MktOpportunityMapper;
import com.lingxi.market.infra.mapper.MktSearchTrendMapper;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/market")
public class MarketController {

    private final MktSearchTrendMapper trendMapper;
    private final MktHotKeywordMapper keywordMapper;
    private final MktOpportunityMapper opportunityMapper;

    public MarketController(MktSearchTrendMapper trendMapper,
                             MktHotKeywordMapper keywordMapper,
                             MktOpportunityMapper opportunityMapper) {
        this.trendMapper = trendMapper;
        this.keywordMapper = keywordMapper;
        this.opportunityMapper = opportunityMapper;
    }

    @GetMapping("/trends")
    @RequirePermission("mkt:trend:view")
    public Result<List<MktSearchTrend>> trends(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String region) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<MktSearchTrend> qw = new LambdaQueryWrapper<MktSearchTrend>()
                .eq(MktSearchTrend::getTenantId, tenantId)
                .orderByDesc(MktSearchTrend::getMetricDate);
        if (StringUtils.hasText(keyword)) {
            qw.eq(MktSearchTrend::getKeyword, keyword);
        }
        if (StringUtils.hasText(region)) {
            qw.eq(MktSearchTrend::getRegion, region);
        }
        return Result.ok(trendMapper.selectList(qw));
    }

    @GetMapping("/keywords")
    @RequirePermission("mkt:trend:view")
    public Result<Map<String, Object>> keywords() {
        Long tenantId = resolveTenantId();
        List<MktHotKeyword> hot = keywordMapper.selectList(new LambdaQueryWrapper<MktHotKeyword>()
                .eq(MktHotKeyword::getTenantId, tenantId)
                .orderByDesc(MktHotKeyword::getHeatScore));
        List<MktHotKeyword> rising = keywordMapper.selectList(new LambdaQueryWrapper<MktHotKeyword>()
                .eq(MktHotKeyword::getTenantId, tenantId)
                .eq(MktHotKeyword::getTrend, "UP")
                .orderByDesc(MktHotKeyword::getHeatScore));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("hot", hot);
        data.put("rising", rising);
        return Result.ok(data);
    }

    @GetMapping("/opportunities")
    @RequirePermission("mkt:opportunity:view")
    public Result<List<MktOpportunity>> opportunities() {
        Long tenantId = resolveTenantId();
        return Result.ok(opportunityMapper.selectList(new LambdaQueryWrapper<MktOpportunity>()
                .eq(MktOpportunity::getTenantId, tenantId)
                .orderByDesc(MktOpportunity::getScore)));
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
