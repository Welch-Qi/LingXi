package com.lingxi.iam.app;

import com.lingxi.starter.security.permission.PermissionDecisionClient;
import org.casbin.jcasbin.main.Enforcer;
import org.springframework.stereotype.Service;

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

    public Enforcer getEnforcer() {
        return enforcer;
    }
}
