package com.lingxi.iam.app;

import org.casbin.jcasbin.main.Enforcer;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 策略管理（角色-权限绑定）。生产可改为 DB Adapter + 管理 API。
 */
@Service
public class PolicyAdminService {

    private final Enforcer enforcer;

    public PolicyAdminService(Enforcer enforcer) {
        this.enforcer = enforcer;
    }

    public boolean addRolePermission(String role, Long tenantId, String permCode) {
        String domain = tenantId == null ? "*" : String.valueOf(tenantId);
        return enforcer.addPolicy(role, domain, permCode, "allow");
    }

    public boolean assignUserRole(String userId, String role, Long tenantId) {
        String domain = tenantId == null ? "*" : String.valueOf(tenantId);
        return enforcer.addGroupingPolicy(userId, role, domain);
    }

    public List<List<String>> listPolicies() {
        return enforcer.getPolicy();
    }

    public List<List<String>> listGrouping() {
        return enforcer.getGroupingPolicy();
    }
}
