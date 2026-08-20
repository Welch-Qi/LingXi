package com.lingxi.iam.app;

import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import com.lingxi.starter.security.permission.PermissionDecisionClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/iam")
public class IamPermissionController {

    private final PermissionDecisionClient permissionDecisionClient;
    private final PolicyAdminService policyAdminService;

    public IamPermissionController(PermissionDecisionClient permissionDecisionClient,
                                   PolicyAdminService policyAdminService) {
        this.permissionDecisionClient = permissionDecisionClient;
        this.policyAdminService = policyAdminService;
    }

    @GetMapping("/permissions/check")
    public Result<Map<String, Object>> check(@RequestParam String permCode) {
        UserContext.UserPrincipal principal = UserContext.require();
        boolean allowed = permissionDecisionClient.enforce(
                principal.getUserId(), principal.getTenantId(), permCode);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("permCode", permCode);
        data.put("allowed", allowed);
        data.put("userId", principal.getUserId());
        data.put("tenantId", principal.getTenantId());
        return Result.ok(data);
    }

    @GetMapping("/policies")
    @RequirePermission("cc:perm:view")
    public Result<Map<String, List<List<String>>>> policies() {
        Map<String, List<List<String>>> data = new LinkedHashMap<>();
        data.put("p", policyAdminService.listPolicies());
        data.put("g", policyAdminService.listGrouping());
        return Result.ok(data);
    }
}
