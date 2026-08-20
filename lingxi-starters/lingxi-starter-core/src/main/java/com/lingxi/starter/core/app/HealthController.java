package com.lingxi.starter.core.app;

import com.lingxi.starter.core.api.HealthResponse;
import com.lingxi.starter.core.result.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 平台级存活探测：统一 Result 格式，供 P1 冒烟与 CI 脚本调用。
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    private final String serviceName;

    public HealthController(@Value("${spring.application.name:lingxi}") String serviceName) {
        this.serviceName = serviceName;
    }

    @GetMapping("/health")
    public Result<HealthResponse> health() {
        return Result.ok(new HealthResponse("UP", serviceName));
    }
}
