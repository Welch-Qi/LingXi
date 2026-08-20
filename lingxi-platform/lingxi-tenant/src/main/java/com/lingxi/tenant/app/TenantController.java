package com.lingxi.tenant.app;

import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import com.lingxi.tenant.domain.SysTenant;
import com.lingxi.tenant.infra.mapper.SysTenantMapper;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    private final SysTenantMapper sysTenantMapper;

    public TenantController(SysTenantMapper sysTenantMapper) {
        this.sysTenantMapper = sysTenantMapper;
    }

    @GetMapping("/current")
    public Result<SysTenant> current() {
        Long tenantId = resolveTenantId();
        SysTenant tenant = sysTenantMapper.selectById(tenantId);
        return Result.ok(tenant);
    }

    @GetMapping("/{id}")
    @RequirePermission("cc:user:manage")
    public Result<SysTenant> getById(@PathVariable Long id) {
        SysTenant tenant = sysTenantMapper.selectById(id);
        return Result.ok(tenant);
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
