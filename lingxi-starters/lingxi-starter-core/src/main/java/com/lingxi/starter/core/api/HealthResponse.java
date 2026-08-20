package com.lingxi.starter.core.api;

/**
 * 平台级健康检查响应。
 */
public record HealthResponse(String status, String service) {
}
