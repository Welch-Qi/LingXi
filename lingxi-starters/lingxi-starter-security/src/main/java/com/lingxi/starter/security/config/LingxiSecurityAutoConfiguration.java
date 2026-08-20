package com.lingxi.starter.security.config;

import com.lingxi.starter.security.jwt.CasdoorJwtAuthenticationConverter;
import com.lingxi.starter.security.permission.PermissionAspect;
import com.lingxi.starter.security.permission.PermissionDecisionClient;
import com.lingxi.starter.security.web.DevBypassAuthenticationFilter;
import com.lingxi.starter.security.web.SecurityContextCleanupFilter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@AutoConfiguration
@EnableConfigurationProperties(LingxiSecurityProperties.class)
@EnableMethodSecurity
@ConditionalOnProperty(prefix = "lingxi.security", name = "enabled", havingValue = "true", matchIfMissing = true)
public class LingxiSecurityAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // 前端联调：浏览器直连 API；凭证走旁路头而非 Cookie
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-User-Id",
                "X-Tenant-Id",
                "X-Username",
                "X-Roles",
                "X-Data-Scope",
                "X-Requested-With",
                "X-Trace-Id"));
        config.setExposedHeaders(List.of("X-Trace-Id"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    @ConditionalOnMissingBean
    public JwtDecoder jwtDecoder(LingxiSecurityProperties properties) {
        return NimbusJwtDecoder.withJwkSetUri(properties.getCasdoor().getJwkSetUri()).build();
    }

    @Bean
    public CasdoorJwtAuthenticationConverter casdoorJwtAuthenticationConverter(LingxiSecurityProperties properties) {
        return new CasdoorJwtAuthenticationConverter(properties);
    }

    @Bean
    @Order(1)
    public SecurityFilterChain lingxiSecurityFilterChain(HttpSecurity http,
                                                         LingxiSecurityProperties properties,
                                                         CasdoorJwtAuthenticationConverter converter) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll();
                    for (String path : properties.getPermitAll()) {
                        auth.requestMatchers(path).permitAll();
                    }
                    if (properties.isDevBypass()) {
                        auth.anyRequest().permitAll();
                    } else {
                        auth.anyRequest().authenticated();
                    }
                })
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(converter)))
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults());

        http.addFilterBefore(new DevBypassAuthenticationFilter(properties), UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(new SecurityContextCleanupFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    @ConditionalOnBean(PermissionDecisionClient.class)
    public PermissionAspect permissionAspect(PermissionDecisionClient permissionDecisionClient) {
        return new PermissionAspect(permissionDecisionClient);
    }
}
