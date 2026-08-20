package com.lingxi.iam.app;

import com.lingxi.starter.security.permission.PermissionDecisionClient;
import org.casbin.jcasbin.main.Enforcer;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 基于 Casbin 的统一权限决策（供 starter-security 注解调用）。
 */
@Service
public class CasbinPermissionDecisionService implements PermissionDecisionClient {

    private final Enforcer enforcer;

    public CasbinPermissionDecisionService(Enforcer enforcer) {
        this.enforcer = enforcer;
    }

    @Override
    public boolean enforce(String subject, Long tenantId, String permCode) {
        if (subject == null || permCode == null) {
            return false;
        }
        // jCasbin 禁止 request.domain 为 "*"；跨租户超管靠 policy 中 p.dom="*" 与 matcher 匹配
        String domain = tenantId == null ? "0" : String.valueOf(tenantId);
        return enforcer.enforce(subject, domain, permCode, "allow")
                || enforcer.enforce(subject, domain, permCode, "*");
    }

    @Override
    public List<String> listPermissions(String subject, Long tenantId) {
        if (!StringUtils.hasText(subject)) {
            return List.of();
        }
        String domain = tenantId == null ? "0" : String.valueOf(tenantId);
        Set<String> permissions = new LinkedHashSet<>();
        collectPermissions(permissions, enforcer.getImplicitPermissionsForUserInDomain(subject, domain));
        collectPermissions(permissions, enforcer.getPermissionsForUserInDomain(subject, domain));
        return new ArrayList<>(permissions);
    }

    private static void collectPermissions(Set<String> permissions, List<List<String>> rules) {
        if (rules == null) {
            return;
        }
        for (List<String> rule : rules) {
            if (rule == null || rule.size() < 4) {
                continue;
            }
            String act = rule.get(3);
            if (!"allow".equals(act) && !"*".equals(act)) {
                continue;
            }
            String permCode = rule.get(2);
            if (!StringUtils.hasText(permCode) || "*".equals(permCode)) {
                continue;
            }
            permissions.add(permCode);
        }
    }

    public Enforcer getEnforcer() {
        return enforcer;
    }
}
