package com.lingxi.auth.config;

import com.lingxi.starter.security.config.LingxiSecurityProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(LingxiSecurityProperties.class)
public class AuthConfiguration {

    @Bean
    public RestClient.Builder lingxiRestClientBuilder() {
        return RestClient.builder();
    }
}
