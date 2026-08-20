package com.lingxi.iam.config;

import com.lingxi.iam.infra.casbin.CasbinEnforcerFactory;
import org.casbin.jcasbin.main.Enforcer;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(CasbinProperties.class)
public class IamCasbinConfiguration {

    @Bean
    public Enforcer casbinEnforcer(CasbinEnforcerFactory factory) {
        return factory.create();
    }
}
