package com.lingxi.market.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.market.domain.MktHotKeyword;
import com.lingxi.market.domain.MktOpportunity;
import com.lingxi.market.domain.MktSearchTrend;
import com.lingxi.market.domain.RegionHeatView;
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

    private static final String TREND_RISING = "UP";

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

    @GetMapping("/search-trends")
    @RequirePermission("mkt:trend:view")
    public Result<Map<String, Object>> searchTrends(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize) {
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
        Page<MktSearchTrend> page = trendMapper.selectPage(new Page<>(pageNo, pageSize), qw);
        return Result.ok(toPageResult(page));
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
                .eq(MktHotKeyword::getTrend, TREND_RISING)
                .orderByDesc(MktHotKeyword::getHeatScore));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("hot", hot);
        data.put("rising", rising);
        return Result.ok(data);
    }

    @GetMapping("/hot-keywords")
    @RequirePermission("mkt:trend:view")
    public Result<Map<String, Object>> hotKeywords(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<MktHotKeyword> qw = buildKeywordQuery(tenantId, category, region)
                .orderByDesc(MktHotKeyword::getHeatScore);
        Page<MktHotKeyword> page = keywordMapper.selectPage(new Page<>(pageNo, pageSize), qw);
        return Result.ok(toPageResult(page));
    }

    @GetMapping("/rising-keywords")
    @RequirePermission("mkt:trend:view")
    public Result<Map<String, Object>> risingKeywords(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<MktHotKeyword> qw = buildKeywordQuery(tenantId, category, region)
                .eq(MktHotKeyword::getTrend, TREND_RISING)
                .orderByDesc(MktHotKeyword::getHeatScore);
        Page<MktHotKeyword> page = keywordMapper.selectPage(new Page<>(pageNo, pageSize), qw);
        return Result.ok(toPageResult(page));
    }

    @GetMapping("/region-heat")
    @RequirePermission("mkt:trend:view")
    public Result<Map<String, Object>> regionHeat(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize) {
        Long tenantId = resolveTenantId();
        String keywordFilter = StringUtils.hasText(keyword) ? keyword : null;
        List<RegionHeatView> aggregated = trendMapper.aggregateRegionHeat(tenantId, keywordFilter);
        return Result.ok(toPageResult(aggregated, pageNo, pageSize));
    }

    @GetMapping("/opportunities")
    @RequirePermission("mkt:opportunity:view")
    public Result<List<MktOpportunity>> opportunities() {
        // TODO: 待事件总线基础设施就绪后发布 lx.mkt.opportunity.discovered 事件
        Long tenantId = resolveTenantId();
        return Result.ok(opportunityMapper.selectList(new LambdaQueryWrapper<MktOpportunity>()
                .eq(MktOpportunity::getTenantId, tenantId)
                .orderByDesc(MktOpportunity::getScore)));
    }

    private LambdaQueryWrapper<MktHotKeyword> buildKeywordQuery(Long tenantId, String category, String region) {
        LambdaQueryWrapper<MktHotKeyword> qw = new LambdaQueryWrapper<MktHotKeyword>()
                .eq(MktHotKeyword::getTenantId, tenantId);
        if (StringUtils.hasText(category)) {
            qw.eq(MktHotKeyword::getCategory, category);
        }
        if (StringUtils.hasText(region)) {
            qw.eq(MktHotKeyword::getRegion, region);
        }
        return qw;
    }

    private Map<String, Object> toPageResult(Page<?> page) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNo", page.getCurrent());
        data.put("pageSize", page.getSize());
        return data;
    }

    private Map<String, Object> toPageResult(List<?> list, long pageNo, long pageSize) {
        int total = list.size();
        int from = (int) Math.min((pageNo - 1) * pageSize, total);
        int to = (int) Math.min(from + pageSize, total);
        List<?> pageList = from < to ? list.subList(from, to) : List.of();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", pageList);
        data.put("total", total);
        data.put("pageNo", pageNo);
        data.put("pageSize", pageSize);
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
