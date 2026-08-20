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

class CasbinPermissionDecisionServiceTest {

    private CasbinPermissionDecisionService service;

    @BeforeEach
    void setUp() throws Exception {
        Enforcer enforcer = loadEnforcer();
        service = new CasbinPermissionDecisionService(enforcer);
    }

    @Test
    void enforceAllowsAdminWildcardPermission() {
        assertThat(service.enforce("10086001", 10086L, "sal:lead:view")).isTrue();
    }

    @Test
    void enforceDeniesUnknownPermissionForNonAdminUser() {
        assertThat(service.enforce("10086003", 10086L, "nonexistent:perm")).isFalse();
    }

    @Test
    void listPermissionsIncludesRoleInheritedPermissions() {
        List<String> permissions = service.listPermissions("10086003", 10086L);

        assertThat(permissions).contains("sal:lead:view", "sal:lead:create");
    }

    @Test
    void listPermissionsIncludesDirectAndInheritedPermissions() {
        Enforcer enforcer = service.getEnforcer();
        enforcer.addPolicy("10086099", "10086", "sal:lead:assign", "allow");

        List<String> permissions = service.listPermissions("10086099", 10086L);

        assertThat(permissions).contains("sal:lead:assign");
    }

    @Test
    void listPermissionsReturnsEmptyForBlankSubject() {
        assertThat(service.listPermissions(null, 10086L)).isEmpty();
        assertThat(service.listPermissions(" ", 10086L)).isEmpty();
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
