package com.lingxi.starter.llm.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * LLM 客户端 / RAG 检索封装自动配置占位。
 */
@AutoConfiguration
public class LingxiLlmAutoConfiguration {

    @Bean
    public LingxiLlmMarker lingxiLlmMarker() {
        return new LingxiLlmMarker();
    }

    public static final class LingxiLlmMarker {
    }
}