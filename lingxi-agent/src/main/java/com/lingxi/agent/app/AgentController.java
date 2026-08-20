package com.lingxi.agent.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingxi.agent.domain.AcAgentConfig;
import com.lingxi.agent.domain.AcAgentRunLog;
import com.lingxi.agent.infra.mapper.AcAgentConfigMapper;
import com.lingxi.agent.infra.mapper.AcAgentRunLogMapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 智能体中心：元数据、配置落库、运行日志与 Runtime 代理。
 */
@RestController
@RequestMapping("/api/v1/agents")
public class AgentController {

    private final RestClient restClient;
    private final String runtimeBaseUrl;
    private final AcAgentConfigMapper configMapper;
    private final AcAgentRunLogMapper runLogMapper;
    private final IdGenerator idGenerator;
    private final ObjectMapper objectMapper;

    public AgentController(
            @Value("${lingxi.agent.runtime-base-url:http://127.0.0.1:8090}") String runtimeBaseUrl,
            AcAgentConfigMapper configMapper,
            AcAgentRunLogMapper runLogMapper,
            IdGenerator idGenerator,
            ObjectMapper objectMapper) {
        this.runtimeBaseUrl = runtimeBaseUrl;
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout(2000);
        rf.setReadTimeout(5000);
        this.restClient = RestClient.builder().requestFactory(rf).build();
        this.configMapper = configMapper;
        this.runLogMapper = runLogMapper;
        this.idGenerator = idGenerator;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    @RequirePermission("ac:agent:view")
    public Result<List<Map<String, Object>>> list() {
        return Result.ok(List.of(
                agent("market_analyst", "市场分析智能体", "搜索趋势/热词/机会"),
                agent("social_marketer", "社媒营销智能体", "内容生成（兼容 Brain: content_creator）"),
                agent("lead_miner", "潜客挖掘智能体", "触达任务（二期能力占位）"),
                agent("sales_converter", "销售转化智能体", "线索分配（兼容 Brain: sales_assistant）"),
                agent("decision_officer", "智能决策智能体", "KPI 汇总与协调")
        ));
    }

    @GetMapping("/prompt-codes")
    @RequirePermission("ac:agent:view")
    public Result<Map<String, String>> promptCodes() {
        Map<String, String> codes = new LinkedHashMap<>();
        codes.put("market_analyst", "prompt.market.opportunity.scan.v1");
        codes.put("social_marketer", "prompt.mkg.content.generate.v1");
        codes.put("content_creator", "prompt.mkg.content.generate.v1");
        codes.put("sales_converter", "prompt.mkg.content.generate.v1");
        codes.put("sales_assistant", "prompt.mkg.content.generate.v1");
        return Result.ok(codes);
    }

    @GetMapping("/{code}/config")
    @RequirePermission("ac:agent:config")
    public Result<Map<String, Object>> getConfig(@PathVariable String code) {
        Long tenantId = resolveTenantId();
        AcAgentConfig row = configMapper.selectOne(new LambdaQueryWrapper<AcAgentConfig>()
                .eq(AcAgentConfig::getTenantId, tenantId)
                .eq(AcAgentConfig::getAgentCode, code));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("agentCode", code);
        data.put("config", row == null ? defaultConfig() : parseJson(row.getConfigJson()));
        return Result.ok(data);
    }

    @PutMapping("/{code}/config")
    @RequirePermission("ac:agent:config")
    public Result<Map<String, Object>> putConfig(@PathVariable String code, @RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        Object configObj = body.containsKey("config") ? body.get("config") : body;
        String json;
        try {
            json = objectMapper.writeValueAsString(configObj == null ? defaultConfig() : configObj);
        } catch (JsonProcessingException e) {
            return Result.fail("BAD_REQUEST", "invalid config json");
        }
        AcAgentConfig existing = configMapper.selectOne(new LambdaQueryWrapper<AcAgentConfig>()
                .eq(AcAgentConfig::getTenantId, tenantId)
                .eq(AcAgentConfig::getAgentCode, code));
        if (existing == null) {
            AcAgentConfig created = new AcAgentConfig();
            created.setId(idGenerator.nextId());
            created.setTenantId(tenantId);
            created.setAgentCode(code);
            created.setConfigJson(json);
            created.setVersion(0);
            configMapper.insert(created);
        } else {
            if (existing.getVersion() == null) {
                existing.setVersion(0);
            }
            existing.setConfigJson(json);
            configMapper.updateById(existing);
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("agentCode", code);
        data.put("config", parseJson(json));
        return Result.ok(data);
    }

    @GetMapping("/run-logs")
    @RequirePermission("ac:agent:view")
    public Result<Map<String, Object>> runLogs(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String agentCode) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<AcAgentRunLog> qw = new LambdaQueryWrapper<AcAgentRunLog>()
                .eq(AcAgentRunLog::getTenantId, tenantId)
                .orderByDesc(AcAgentRunLog::getCreatedAt);
        if (StringUtils.hasText(agentCode)) {
            qw.eq(AcAgentRunLog::getAgentCode, agentCode.trim());
        }
        Page<AcAgentRunLog> page = runLogMapper.selectPage(new Page<>(pageNo, pageSize), qw);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNo", page.getCurrent());
        data.put("pageSize", page.getSize());
        return Result.ok(data);
    }

    @PostMapping("/run")
    @RequirePermission("ac:agent:view")
    public Result<Map<?, ?>> run(@RequestBody Map<String, Object> body) {
        long started = System.currentTimeMillis();
        String agentCode = body.get("agentCode") != null ? String.valueOf(body.get("agentCode"))
                : body.get("agent") != null ? String.valueOf(body.get("agent")) : "unknown";
        String action = body.get("action") != null ? String.valueOf(body.get("action")) : "run";
        Map<?, ?> resp;
        String status;
        try {
            resp = restClient.post()
                    .uri(runtimeBaseUrl + "/api/v1/agent/run")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            status = "SUCCESS";
            if (resp != null && resp.get("status") != null) {
                status = String.valueOf(resp.get("status"));
            }
        } catch (Exception ex) {
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("status", "runtime_unavailable");
            fallback.put("message", ex.getMessage());
            fallback.put("hint", "启动 lingxi-agent-runtime: python -m lingxi_agent_runtime.main serve");
            resp = fallback;
            status = "runtime_unavailable";
        }
        persistRunLog(agentCode, action, status, (int) (System.currentTimeMillis() - started), body, resp);
        return Result.ok(resp);
    }

    private void persistRunLog(
            String agentCode,
            String action,
            String status,
            int durationMs,
            Map<String, Object> request,
            Map<?, ?> response) {
        try {
            Long tenantId = resolveTenantId();
            AcAgentRunLog log = new AcAgentRunLog();
            log.setId(idGenerator.nextId());
            log.setTenantId(tenantId);
            log.setAgentCode(agentCode);
            log.setAction(action);
            Object related = request.get("relatedObject");
            if (related == null) {
                related = request.get("object");
            }
            if (related != null) {
                log.setRelatedObject(String.valueOf(related));
            }
            log.setStatus(status);
            log.setDurationMs(durationMs);
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("request", request);
            payload.put("response", response);
            log.setPayload(objectMapper.writeValueAsString(payload));
            runLogMapper.insert(log);
        } catch (Exception ignored) {
            // logging must not break agent run proxy
        }
    }

    private static Map<String, Object> defaultConfig() {
        Map<String, Object> cfg = new LinkedHashMap<>();
        cfg.put("enabled", true);
        cfg.put("temperature", 0.7);
        cfg.put("maxTokens", 2048);
        return cfg;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) {
        if (!StringUtils.hasText(json)) {
            return defaultConfig();
        }
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (JsonProcessingException e) {
            return Map.of("_raw", json);
        }
    }

    private static Map<String, Object> agent(String id, String name, String desc) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("description", desc);
        return m;
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
