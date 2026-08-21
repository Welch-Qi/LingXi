package com.lingxi.decision.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingxi.decision.domain.DmKpiSnapshot;
import com.lingxi.decision.infra.mapper.DmKpiSnapshotMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DecisionDashboardService {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final List<String> CARD_KEYS = List.of(
            "products", "hot", "impression", "click", "lead", "order", "deal");
    private static final Map<String, String> CARD_LABELS = Map.of(
            "products", "商品数",
            "hot", "爆品数",
            "impression", "曝光量",
            "click", "点击量",
            "lead", "潜客量",
            "order", "订单量",
            "deal", "成交量");
    private static final Map<String, String> CARD_ICONS = Map.of(
            "products", "Boxes",
            "hot", "Flame",
            "impression", "Eye",
            "click", "MousePointerClick",
            "lead", "Users",
            "order", "ShoppingCart",
            "deal", "BadgeCheck");
    private static final List<String> FUNNEL_CODES = List.of(
            "funnel_impression", "funnel_click", "funnel_lead", "funnel_order");
    private static final Map<String, String> FUNNEL_LABELS = Map.of(
            "funnel_impression", "曝光量",
            "funnel_click", "点击量",
            "funnel_lead", "潜客量",
            "funnel_order", "订单量");
    private static final Map<String, String> FUNNEL_COLORS = Map.of(
            "funnel_impression", "#1e3a8a",
            "funnel_click", "#1d4ed8",
            "funnel_lead", "#2563eb",
            "funnel_order", "#3b82f6");
    private static final Set<String> ASK_METRIC_WHITELIST = Set.of(
            "revenue", "leads", "win_rate", "customers",
            "products", "hot", "impression", "click", "lead", "order", "deal",
            "funnel_impression", "funnel_click", "funnel_lead", "funnel_order");

    private final DmKpiSnapshotMapper kpiSnapshotMapper;
    private final ObjectMapper objectMapper;

    public DecisionDashboardService(DmKpiSnapshotMapper kpiSnapshotMapper, ObjectMapper objectMapper) {
        this.kpiSnapshotMapper = kpiSnapshotMapper;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> buildDashboard(Long tenantId) {
        List<DmKpiSnapshot> all = kpiSnapshotMapper.selectList(new LambdaQueryWrapper<DmKpiSnapshot>()
                .eq(DmKpiSnapshot::getTenantId, tenantId));

        String monthKey = latestMonthKey(all);
        String dayKey = latestDayKey(all);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("periodMonth", monthKey);
        data.put("periodDay", dayKey);
        data.put("kpis", buildKpis(all, monthKey, dayKey));
        data.put("countryHeat", buildCountryHeat(all));
        data.put("countryDetails", buildCountryDetails(all));
        data.put("countryRanks", buildCountryRanks(all));
        data.put("productRanks", buildProductRanks(all));
        data.put("funnel", buildFunnel(all, monthKey));
        data.put("trend", buildTrend(all));
        data.put("updatedAtHint", "数据更新于刚才");
        return data;
    }

    public Map<String, Object> askQuestion(Long tenantId, String metricCode) {
        Map<String, Object> data = new LinkedHashMap<>();
        if (!StringUtils.hasText(metricCode)) {
            data.put("answer", "请提供有效的指标代码。");
            return data;
        }
        String normalized = metricCode.toLowerCase(Locale.ROOT);
        if (!ASK_METRIC_WHITELIST.contains(normalized)) {
            data.put("metricCode", normalized);
            data.put("answer", "未知指标「" + normalized + "」，请从白名单中选择。");
            return data;
        }
        List<DmKpiSnapshot> rows = kpiSnapshotMapper.selectList(new LambdaQueryWrapper<DmKpiSnapshot>()
                .eq(DmKpiSnapshot::getTenantId, tenantId)
                .eq(DmKpiSnapshot::getMetricCode, normalized)
                .orderByDesc(DmKpiSnapshot::getPeriodKey));
        DmKpiSnapshot latest = rows.isEmpty() ? null : rows.get(0);
        data.put("metricCode", normalized);
        data.put("rows", rows);
        if (latest != null) {
            data.put("value", latest.getMetricValue());
            data.put("unit", latest.getUnit());
            data.put("periodKey", latest.getPeriodKey());
            data.put("metricName", latest.getMetricName());
            data.put("answer", buildAskAnswer(latest));
        } else {
            data.put("answer", "暂无指标「" + normalized + "」的快照数据。");
        }
        return data;
    }

    private List<Map<String, Object>> buildKpis(List<DmKpiSnapshot> all, String monthKey, String dayKey) {
        List<Map<String, Object>> cards = new ArrayList<>();
        for (String key : CARD_KEYS) {
            BigDecimal monthVal = valueOf(all, key, monthKey);
            BigDecimal dayVal = valueOf(all, key, dayKey);
            BigDecimal prevMonth = valueOf(all, key, previousMonth(monthKey));
            String change = formatChange(monthVal, prevMonth);
            Map<String, Object> card = new LinkedHashMap<>();
            card.put("key", key);
            card.put("label", CARD_LABELS.getOrDefault(key, key));
            card.put("month", formatDisplay(key, monthVal));
            card.put("today", formatToday(key, dayVal));
            card.put("change", change);
            card.put("icon", CARD_ICONS.getOrDefault(key, "Boxes"));
            cards.add(card);
        }
        return cards;
    }

    private Map<String, Number> buildCountryHeat(List<DmKpiSnapshot> all) {
        List<DmKpiSnapshot> rows = filterCode(all, "orders_by_country");
        long max = rows.stream().map(DmKpiSnapshot::getMetricValue).filter(v -> v != null)
                .mapToLong(v -> v.longValue()).max().orElse(1L);
        Map<String, Number> heat = new LinkedHashMap<>();
        for (DmKpiSnapshot row : rows) {
            Map<String, Object> dim = parseDims(row.getDimensions());
            String iso = String.valueOf(dim.getOrDefault("iso", ""));
            if (!StringUtils.hasText(iso)) {
                continue;
            }
            long orders = row.getMetricValue() == null ? 0L : row.getMetricValue().longValue();
            int score = (int) Math.round(orders * 100.0 / Math.max(max, 1));
            heat.put(iso, Math.max(1, Math.min(100, score)));
        }
        return heat;
    }

    private Map<String, Object> buildCountryDetails(List<DmKpiSnapshot> all) {
        Map<String, Object> details = new LinkedHashMap<>();
        Map<String, DmKpiSnapshot> byIso = new LinkedHashMap<>();
        for (DmKpiSnapshot row : filterCode(all, "orders_by_country")) {
            Map<String, Object> dim = parseDims(row.getDimensions());
            String iso = String.valueOf(dim.getOrDefault("iso", ""));
            if (StringUtils.hasText(iso)) {
                byIso.put(iso, row);
            }
        }
        for (Map.Entry<String, DmKpiSnapshot> e : byIso.entrySet()) {
            Map<String, Object> dim = parseDims(e.getValue().getDimensions());
            long order = e.getValue().getMetricValue() == null ? 0L : e.getValue().getMetricValue().longValue();
            long lead = asLong(dim.get("lead"), order * 6);
            long deal = asLong(dim.get("deal"), Math.round(order * 0.7));
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("name", String.valueOf(dim.getOrDefault("name", e.getKey())));
            d.put("lead", lead);
            d.put("order", order);
            d.put("deal", deal);
            details.put(e.getKey(), d);
        }
        return details;
    }

    private List<Map<String, Object>> buildCountryRanks(List<DmKpiSnapshot> all) {
        List<DmKpiSnapshot> rows = filterCode(all, "orders_by_country").stream()
                .sorted(Comparator.comparing(DmKpiSnapshot::getMetricValue, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .collect(Collectors.toList());
        long total = rows.stream().map(DmKpiSnapshot::getMetricValue).filter(v -> v != null)
                .mapToLong(BigDecimal::longValue).sum();
        List<Map<String, Object>> ranks = new ArrayList<>();
        for (DmKpiSnapshot row : rows) {
            Map<String, Object> dim = parseDims(row.getDimensions());
            long orders = row.getMetricValue() == null ? 0L : row.getMetricValue().longValue();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("country", String.valueOf(dim.getOrDefault("name", "")));
            item.put("isoCode", String.valueOf(dim.getOrDefault("iso", "")));
            item.put("orders", orders);
            item.put("share", total <= 0 ? 0 : round1(orders * 100.0 / total));
            ranks.add(item);
        }
        return ranks;
    }

    private List<Map<String, Object>> buildProductRanks(List<DmKpiSnapshot> all) {
        List<DmKpiSnapshot> rows = filterCode(all, "orders_by_product").stream()
                .sorted(Comparator.comparing(DmKpiSnapshot::getMetricValue, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .collect(Collectors.toList());
        List<Map<String, Object>> ranks = new ArrayList<>();
        for (DmKpiSnapshot row : rows) {
            Map<String, Object> dim = parseDims(row.getDimensions());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("product", String.valueOf(dim.getOrDefault("product", row.getMetricName())));
            item.put("orders", row.getMetricValue() == null ? 0 : row.getMetricValue().longValue());
            item.put("revenue", asLong(dim.get("revenue"), 0));
            ranks.add(item);
        }
        return ranks;
    }

    private List<Map<String, Object>> buildFunnel(List<DmKpiSnapshot> all, String monthKey) {
        List<Map<String, Object>> steps = new ArrayList<>();
        for (String code : FUNNEL_CODES) {
            BigDecimal val = valueOf(all, code, monthKey);
            if (val == null) {
                val = latestValue(all, code);
            }
            Map<String, Object> step = new LinkedHashMap<>();
            step.put("label", FUNNEL_LABELS.getOrDefault(code, code));
            step.put("value", val == null ? 0 : val.longValue());
            step.put("color", FUNNEL_COLORS.getOrDefault(code, "#3b82f6"));
            steps.add(step);
        }
        return steps;
    }

    private List<Map<String, Object>> buildTrend(List<DmKpiSnapshot> all) {
        List<String> days = all.stream()
                .map(DmKpiSnapshot::getPeriodKey)
                .filter(pk -> pk != null && pk.length() == 10 && pk.charAt(4) == '-')
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        if (days.size() > 30) {
            days = days.subList(days.size() - 30, days.size());
        }
        List<Map<String, Object>> trend = new ArrayList<>();
        int i = 1;
        for (String day : days) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", i + "日");
            point.put("dateKey", day);
            point.put("impression", asLong(valueOf(all, "impression", day), 0));
            point.put("click", asLong(valueOf(all, "click", day), 0));
            point.put("lead", asLong(valueOf(all, "lead", day), 0));
            point.put("order", asLong(valueOf(all, "order", day), 0));
            trend.add(point);
            i++;
        }
        return trend;
    }

    private static List<DmKpiSnapshot> filterCode(List<DmKpiSnapshot> all, String code) {
        return all.stream().filter(r -> code.equals(r.getMetricCode())).collect(Collectors.toList());
    }

    private static BigDecimal valueOf(List<DmKpiSnapshot> all, String code, String periodKey) {
        if (!StringUtils.hasText(periodKey)) {
            return null;
        }
        return all.stream()
                .filter(r -> code.equals(r.getMetricCode()) && periodKey.equals(r.getPeriodKey()))
                .map(DmKpiSnapshot::getMetricValue)
                .findFirst()
                .orElse(null);
    }

    private static BigDecimal latestValue(List<DmKpiSnapshot> all, String code) {
        return all.stream()
                .filter(r -> code.equals(r.getMetricCode()))
                .sorted(Comparator.comparing(DmKpiSnapshot::getPeriodKey, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(DmKpiSnapshot::getMetricValue)
                .findFirst()
                .orElse(null);
    }

    private static String latestMonthKey(List<DmKpiSnapshot> all) {
        return all.stream()
                .map(DmKpiSnapshot::getPeriodKey)
                .filter(pk -> pk != null && pk.length() == 7)
                .max(Comparator.naturalOrder())
                .orElse(LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM")));
    }

    private static String latestDayKey(List<DmKpiSnapshot> all) {
        return all.stream()
                .map(DmKpiSnapshot::getPeriodKey)
                .filter(pk -> pk != null && pk.length() == 10)
                .max(Comparator.naturalOrder())
                .orElse(LocalDate.now().format(DAY));
    }

    private static String previousMonth(String monthKey) {
        if (!StringUtils.hasText(monthKey) || monthKey.length() < 7) {
            return null;
        }
        try {
            LocalDate d = LocalDate.parse(monthKey + "-01");
            return d.minusMonths(1).format(DateTimeFormatter.ofPattern("yyyy-MM"));
        } catch (Exception e) {
            return null;
        }
    }

    private static String formatChange(BigDecimal current, BigDecimal previous) {
        if (current == null || previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return "+0.0%";
        }
        BigDecimal pct = current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 1, RoundingMode.HALF_UP);
        String sign = pct.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "";
        return sign + pct.toPlainString() + "%";
    }

    private static String formatDisplay(String key, BigDecimal value) {
        if (value == null) {
            return "0";
        }
        long v = value.longValue();
        if ("impression".equals(key) || "click".equals(key)) {
            if (v >= 1_000_000) {
                return String.format(Locale.US, "%.1fM", v / 1_000_000.0);
            }
            if (v >= 1_000) {
                return String.format(Locale.US, "%.1fK", v / 1_000.0);
            }
        }
        return String.format(Locale.US, "%,d", v);
    }

    private static String formatToday(String key, BigDecimal value) {
        if (value == null) {
            return "0";
        }
        long v = value.longValue();
        if ("products".equals(key) || "hot".equals(key)) {
            return (v >= 0 ? "+" : "") + v;
        }
        if ("impression".equals(key) || "click".equals(key)) {
            if (v >= 1_000) {
                return String.format(Locale.US, "%.1fK", v / 1_000.0);
            }
        }
        return String.format(Locale.US, "%,d", v);
    }

    private Map<String, Object> parseDims(String raw) {
        if (!StringUtils.hasText(raw)) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private static long asLong(Object v, long fallback) {
        if (v == null) {
            return fallback;
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(v));
        } catch (Exception e) {
            return fallback;
        }
    }

    private static long asLong(BigDecimal v, long fallback) {
        return v == null ? fallback : v.longValue();
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static String buildAskAnswer(DmKpiSnapshot latest) {
        BigDecimal value = latest.getMetricValue();
        String unit = latest.getUnit() == null ? "" : latest.getUnit();
        String name = latest.getMetricName() == null ? latest.getMetricCode() : latest.getMetricName();
        String period = latest.getPeriodKey() == null ? "" : latest.getPeriodKey();
        return String.format(Locale.CHINA,
                "【%s】在周期 %s 的值为 %s%s。",
                name, period, value == null ? "—" : value.stripTrailingZeros().toPlainString(),
                formatAskUnit(unit));
    }

    private static String formatAskUnit(String unit) {
        if (!StringUtils.hasText(unit) || "COUNT".equalsIgnoreCase(unit)) {
            return "";
        }
        if ("RATIO".equalsIgnoreCase(unit)) {
            return "（比率）";
        }
        return " " + unit;
    }
}
