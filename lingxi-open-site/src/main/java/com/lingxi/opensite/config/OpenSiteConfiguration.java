package com.lingxi.opensite.config;

import com.lingxi.opensite.web.SiteContextInterceptor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(OpenSiteProperties.class)
@ConditionalOnProperty(prefix = "lingxi.open-site", name = "enabled", havingValue = "true", matchIfMissing = true)
public class OpenSiteConfiguration implements WebMvcConfigurer {

    private final SiteContextInterceptor siteContextInterceptor;

    public OpenSiteConfiguration(SiteContextInterceptor siteContextInterceptor) {
        this.siteContextInterceptor = siteContextInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(siteContextInterceptor)
                .addPathPatterns("/api/v1/open/site/**");
    }
}
