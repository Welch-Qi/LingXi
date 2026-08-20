package com.lingxi;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.DisabledIfSystemProperty;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * 上下文冒烟：依赖本机隧道 PostgreSQL（默认 application.yml）。
 * 若库未就绪，可加 -Dsmoke.skip=true 跳过（CI 用）。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DisabledIfSystemProperty(named = "smoke.skip", matches = "true")
class LingxiServerSmokeIT {

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        // Redis 非强依赖：避免无 Redis 客户端 starter 时无影响；有隧道则沿用 yml
        registry.add("lingxi.security.dev-bypass", () -> "true");
    }

    @Test
    void contextLoads() {
        // Flyway + 组件扫描启动即通过
    }
}
