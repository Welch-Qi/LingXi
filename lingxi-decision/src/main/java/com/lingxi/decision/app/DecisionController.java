package com.lingxi.decision.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.decision.domain.DmKpiSnapshot;
import com.lingxi.decision.infra.mapper.DmKpiSnapshotMapper;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/decision")
public class DecisionController {

    private static final Set<String> METRIC_WHITELIST = Set.of(
            "revenue", "leads", "win_rate", "customers",
            "products", "hot", "impression", "click", "lead", "order", "deal",
            "funnel_impression", "funnel_click", "funnel_lead", "funnel_order");

    private static final Map<String, String> METRIC_ALIASES = Map.ofEntries(
            Map.entry("潜客", "lead"),
            Map.entry("线索", "leads"),
            Map.entry("曝光", "impression"),
            Map.entry("点击", "click"),
            Map.entry("订单", "order"),
            Map.entry("成交", "deal"),
            Map.entry("营收", "revenue"),
            Map.entry("转化", "win_rate"),
            Map.entry("客户", "customers"),
            Map.entry("商品", "products"),
            Map.entry("爆品", "hot")
    );

    private static final Pattern METRIC_CODE_PATTERN = Pattern.compile(
            "metric_code\\s*=\\s*['\"]?([a-zA-Z0-9_]+)['\"]?", Pattern.CASE_INSENSITIVE);

    private final DmKpiSnapshotMapper kpiSnapshotMapper;
    private final DecisionDashboardService dashboardService;

    public DecisionController(DmKpiSnapshotMapper kpiSnapshotMapper, DecisionDashboardService dashboardService) {
        this.kpiSnapshotMapper = kpiSnapshotMapper;
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    @RequirePermission("dm:dashboard:view")
    public Result<Map<String, Object>> dashboard() {
        return Result.ok(dashboardService.buildDashboard(resolveTenantId()));
    }

    @GetMapping("/kpis")
    @RequirePermission("dm:dashboard:view")
    public Result<List<DmKpiSnapshot>> kpis(@RequestParam(required = false) String periodKey) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<DmKpiSnapshot> qw = new LambdaQueryWrapper<DmKpiSnapshot>()
                .eq(DmKpiSnapshot::getTenantId, tenantId)
                .orderByDesc(DmKpiSnapshot::getPeriodKey)
                .orderByAsc(DmKpiSnapshot::getMetricCode);
        if (StringUtils.hasText(periodKey)) {
            qw.eq(DmKpiSnapshot::getPeriodKey, periodKey);
        }
        return Result.ok(kpiSnapshotMapper.selectList(qw));
    }

    @PostMapping("/ask")
    @RequirePermission("dm:qa:ask")
    public Result<Map<String, Object>> askQuestion(@RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        String dsl = body.get("dsl") == null ? "" : body.get("dsl").toString().trim();
        String question = body.get("question") == null ? dsl : body.get("question").toString().trim();
        String metricCode = body.get("metricCode") == null ? null : body.get("metricCode").toString();
        if (!StringUtils.hasText(metricCode) && StringUtils.hasText(dsl)) {
            Matcher m = METRIC_CODE_PATTERN.matcher(dsl);
            if (m.find()) {
                metricCode = m.group(1);
            }
        }
        if (!StringUtils.hasText(metricCode) && StringUtils.hasText(question)) {
            metricCode = inferMetricFromQuestion(question);
        }
        if (!StringUtils.hasText(metricCode)) {
            return Result.fail("INVALID_DSL", "only metric_code queries from whitelist are allowed");
        }
        metricCode = metricCode.toLowerCase(Locale.ROOT);
        if (!METRIC_WHITELIST.contains(metricCode)) {
            return Result.fail("METRIC_NOT_ALLOWED", "metric_code not in whitelist: " + metricCode);
        }
        if (StringUtils.hasText(dsl) && looksLikeRawSql(dsl)) {
            return Result.fail("INVALID_DSL", "raw SQL is not allowed");
        }
        List<DmKpiSnapshot> rows = kpiSnapshotMapper.selectList(new LambdaQueryWrapper<DmKpiSnapshot>()
                .eq(DmKpiSnapshot::getTenantId, tenantId)
                .eq(DmKpiSnapshot::getMetricCode, metricCode)
                .orderByDesc(DmKpiSnapshot::getPeriodKey));
        DmKpiSnapshot latest = rows.isEmpty() ? null : rows.get(0);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("metricCode", metricCode);
        data.put("rows", rows);
        data.put("dsl", dsl);
        if (latest != null) {
            data.put("value", latest.getMetricValue());
            data.put("unit", latest.getUnit());
            data.put("periodKey", latest.getPeriodKey());
            data.put("metricName", latest.getMetricName());
            data.put("answer", buildAnswer(latest));
        } else {
            data.put("answer", "暂无指标「" + metricCode + "」的快照数据。");
        }
        return Result.ok(data);
    }

    private static String inferMetricFromQuestion(String question) {
        for (Map.Entry<String, String> e : METRIC_ALIASES.entrySet()) {
            if (question.contains(e.getKey())) {
                return e.getValue();
            }
        }
        String lower = question.toLowerCase(Locale.ROOT);
        if (lower.contains("revenue")) {
            return "revenue";
        }
        if (lower.contains("impression")) {
            return "impression";
        }
        if (lower.contains("click")) {
            return "click";
        }
        if (lower.contains("order")) {
            return "order";
        }
        if (lower.contains("deal") || lower.contains("win")) {
            return "deal";
        }
        if (lower.contains("lead")) {
            return "lead";
        }
        return null;
    }

    private static String buildAnswer(DmKpiSnapshot latest) {
        BigDecimal value = latest.getMetricValue();
        String unit = latest.getUnit() == null ? "" : latest.getUnit();
        String name = latest.getMetricName() == null ? latest.getMetricCode() : latest.getMetricName();
        String period = latest.getPeriodKey() == null ? "" : latest.getPeriodKey();
        return String.format(Locale.CHINA,
                "【%s】在周期 %s 的值为 %s%s。",
                name, period, value == null ? "—" : value.stripTrailingZeros().toPlainString(),
                formatUnit(unit));
    }

    private static String formatUnit(String unit) {
        if (!StringUtils.hasText(unit) || "COUNT".equalsIgnoreCase(unit)) {
            return "";
        }
        if ("RATIO".equalsIgnoreCase(unit)) {
            return "（比率）";
        }
        return " " + unit;
    }

    private static boolean looksLikeRawSql(String dsl) {
        String lower = dsl.toLowerCase(Locale.ROOT);
        return lower.contains("select ")
                || lower.contains(" insert ")
                || lower.contains(" update ")
                || lower.contains(" delete ")
                || lower.contains(" drop ")
                || lower.contains(";")
                || lower.contains("--");
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
