package com.lingxi.marketing.app;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 调用 Python Agent Runtime 生成社媒文案；不可用时由调用方本地兜底。
 */
@Service
public class ContentAgentClient {

    private final RestClient restClient;
    private final String runtimeBaseUrl;

    public ContentAgentClient(
            @Value("${lingxi.agent.runtime-base-url:http://127.0.0.1:8090}") String runtimeBaseUrl) {
        this.runtimeBaseUrl = runtimeBaseUrl;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2_000);
        factory.setReadTimeout(60_000);
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    /**
     * @return map with keys: ok, draft, summary, source, status, raw (optional)
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> generate(String topic, String locale, String tenantId, String userId) {
        Map<String, Object> result = new LinkedHashMap<>();
        String goal = topic;
        if (StringUtils.hasText(locale)) {
            goal = topic + " | locale=" + locale.trim();
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("goal", goal);
        body.put("tenant_id", tenantId);
        body.put("user_id", userId);

        try {
            Map<?, ?> resp = restClient.post()
                    .uri(runtimeBaseUrl + "/api/v1/agent/run")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (resp == null) {
                result.put("ok", false);
                result.put("status", "empty_response");
                return result;
            }
            Object statusObj = resp.get("status");
            String status = statusObj == null ? "" : String.valueOf(statusObj);
            if ("runtime_unavailable".equalsIgnoreCase(status) || "failed".equalsIgnoreCase(status)) {
                result.put("ok", false);
                result.put("status", status);
                result.put("message", resp.get("error") != null ? resp.get("error") : resp.get("message"));
                return result;
            }

            String draft = extractDraft(resp);
            String summary = resp.get("finalAnswer") == null ? null : String.valueOf(resp.get("finalAnswer"));
            if (!StringUtils.hasText(draft) && StringUtils.hasText(summary)) {
                draft = summary;
            }
            result.put("ok", StringUtils.hasText(draft));
            result.put("draft", draft);
            result.put("summary", summary);
            result.put("source", "social_marketer");
            result.put("status", status.isEmpty() ? "completed" : status);
            result.put("taskId", resp.get("taskId"));
            return result;
        } catch (Exception ex) {
            result.put("ok", false);
            result.put("status", "runtime_unavailable");
            result.put("message", ex.getMessage());
            return result;
        }
    }

    @SuppressWarnings("unchecked")
    static String extractDraft(Map<?, ?> resp) {
        Object outputs = resp.get("agentOutputs");
        if (!(outputs instanceof Map<?, ?> outMap)) {
            return null;
        }
        Object marketer = outMap.get("social_marketer");
        if (!(marketer instanceof Map<?, ?> m)) {
            // try content_creator alias
            marketer = outMap.get("content_creator");
        }
        if (!(marketer instanceof Map<?, ?> agent)) {
            return null;
        }
        Object tool = agent.get("tool");
        if (tool instanceof Map<?, ?> toolMap) {
            Object draft = toolMap.get("draft");
            if (draft != null && StringUtils.hasText(String.valueOf(draft))) {
                return String.valueOf(draft);
            }
            Object nested = toolMap.get("result");
            if (nested instanceof Map<?, ?> nestedMap && nestedMap.get("draft") != null) {
                return String.valueOf(nestedMap.get("draft"));
            }
        }
        Object summary = agent.get("summary");
        if (summary != null && StringUtils.hasText(String.valueOf(summary))) {
            return String.valueOf(summary);
        }
        return null;
    }
}
