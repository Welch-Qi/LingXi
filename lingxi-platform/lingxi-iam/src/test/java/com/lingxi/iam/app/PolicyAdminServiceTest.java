package com.lingxi.iam.app;

import org.casbin.jcasbin.main.Enforcer;
import org.casbin.jcasbin.model.Model;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.DefaultResourceLoader;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.util.StreamUtils.copyToString;

class PolicyAdminServiceTest {

    private PolicyAdminService service;
    private Enforcer enforcer;

    @BeforeEach
    void setUp() throws Exception {
        enforcer = loadEnforcer();
        service = new PolicyAdminService(enforcer);
    }

    @Test
    void addRolePermissionAddsPolicy() {
        assertThat(service.addRolePermission("role_test", 10086L, "test:perm:view")).isTrue();
        assertThat(enforcer.enforce("role_test", "10086", "test:perm:view", "allow")).isTrue();
    }

    @Test
    void assignUserRoleAddsGroupingPolicy() {
        assertThat(service.assignUserRole("u_test", "role_test", 10086L)).isTrue();
        assertThat(enforcer.hasGroupingPolicy("u_test", "role_test", "10086")).isTrue();
    }

    @Test
    void listPoliciesReturnsLoadedPolicies() {
        List<List<String>> policies = service.listPolicies();

        assertThat(policies).isNotEmpty();
        assertThat(policies.stream().anyMatch(rule -> "role_admin".equals(rule.get(0)))).isTrue();
    }

    @Test
    void listGroupingReturnsLoadedGroupingRules() {
        List<List<String>> grouping = service.listGrouping();

        assertThat(grouping).isNotEmpty();
        assertThat(grouping.stream().anyMatch(rule -> "10086001".equals(rule.get(0)))).isTrue();
    }

    private static Enforcer loadEnforcer() throws Exception {
        DefaultResourceLoader loader = new DefaultResourceLoader();
        String modelText;
        try (InputStream in = loader.getResource("classpath:casbin/model.conf").getInputStream()) {
            modelText = copyToString(in, StandardCharsets.UTF_8);
        }
        Model model = new Model();
        model.loadModelFromText(modelText);
        Enforcer enforcer = new Enforcer(model);
        try (InputStream in = loader.getResource("classpath:casbin/policy.csv").getInputStream()) {
            String content = copyToString(in, StandardCharsets.UTF_8);
            for (String raw : content.split("\\R")) {
                String line = raw.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                String[] parts = line.split("\\s*,\\s*");
                if ("p".equals(parts[0]) && parts.length >= 5) {
                    enforcer.addPolicy(parts[1], parts[2], parts[3], parts[4]);
                } else if ("g".equals(parts[0]) && parts.length >= 4) {
                    enforcer.addGroupingPolicy(parts[1], parts[2], parts[3]);
                }
            }
        }
        return enforcer;
    }
}
