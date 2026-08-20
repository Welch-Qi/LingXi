package com.lingxi;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.DisabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 端到端冒烟：验证 /api/v1/health 在完整应用上下文中可用。
 * 依赖本机 PostgreSQL；若库未就绪，可加 -Dsmoke.skip=true 跳过。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@DisabledIfSystemProperty(named = "smoke.skip", matches = "true")
class HealthEndpointSmokeIT {

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("lingxi.security.dev-bypass", () -> "true");
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointIsPublicAndReturnsUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("0"))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.service").value("lingxi-server"));
    }
}
