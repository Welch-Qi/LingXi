package com.lingxi.user.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import com.lingxi.user.domain.SysUser;
import com.lingxi.user.infra.mapper.SysUserMapper;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final SysUserMapper sysUserMapper;
    private final IdGenerator idGenerator;

    public UserController(SysUserMapper sysUserMapper, IdGenerator idGenerator) {
        this.sysUserMapper = sysUserMapper;
        this.idGenerator = idGenerator;
    }

    @GetMapping
    @RequirePermission("cc:user:manage")
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String staffType) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<SysUser> qw = new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getTenantId, tenantId)
                .orderByDesc(SysUser::getId);
        if (StringUtils.hasText(staffType)) {
            qw.eq(SysUser::getStaffType, staffType.trim().toUpperCase());
        }
        Page<SysUser> page = sysUserMapper.selectPage(new Page<>(pageNo, pageSize), qw);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNo", page.getCurrent());
        data.put("pageSize", page.getSize());
        return Result.ok(data);
    }

    @GetMapping("/{id}")
    @RequirePermission("cc:user:manage")
    public Result<SysUser> getById(@PathVariable Long id) {
        return Result.ok(requireUser(resolveTenantId(), id));
    }

    @PostMapping
    @RequirePermission("cc:user:manage")
    public Result<SysUser> create(@RequestBody SysUser body) {
        if (!StringUtils.hasText(body.getEmail()) || !StringUtils.hasText(body.getDisplayName())) {
            return Result.fail("BAD_REQUEST", "email and displayName are required");
        }
        Long tenantId = resolveTenantId();
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("EMP"));
        }
        if (!StringUtils.hasText(body.getStaffType())) {
            body.setStaffType("HUMAN");
        }
        if (body.getIsActive() == null) {
            body.setIsActive(true);
        }
        sysUserMapper.insert(body);
        return Result.ok(body);
    }

    @PutMapping("/{id}")
    @RequirePermission("cc:user:manage")
    public Result<SysUser> update(@PathVariable Long id, @RequestBody SysUser body) {
        SysUser existing = requireUser(resolveTenantId(), id);
        if (StringUtils.hasText(body.getDisplayName())) {
            existing.setDisplayName(body.getDisplayName());
        }
        if (StringUtils.hasText(body.getEmail())) {
            existing.setEmail(body.getEmail());
        }
        if (body.getDepartment() != null) {
            existing.setDepartment(body.getDepartment());
        }
        if (body.getTitle() != null) {
            existing.setTitle(body.getTitle());
        }
        if (body.getPhone() != null) {
            existing.setPhone(body.getPhone());
        }
        if (body.getSex() != null) {
            existing.setSex(body.getSex());
        }
        if (body.getStaffType() != null) {
            existing.setStaffType(body.getStaffType());
        }
        if (body.getIsActive() != null) {
            existing.setIsActive(body.getIsActive());
        }
        if (body.getCasdoorName() != null) {
            existing.setCasdoorName(body.getCasdoorName());
        }
        sysUserMapper.updateById(existing);
        return Result.ok(existing);
    }

    @DeleteMapping("/{id}")
    @RequirePermission("cc:user:manage")
    public Result<Map<String, Object>> delete(@PathVariable Long id) {
        SysUser existing = requireUser(resolveTenantId(), id);
        existing.setIsActive(false);
        sysUserMapper.updateById(existing);
        sysUserMapper.deleteById(id);
        return Result.ok(Map.of("deleted", true, "id", id));
    }

    private SysUser requireUser(Long tenantId, Long id) {
        SysUser user = sysUserMapper.selectOne(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getId, id)
                .eq(SysUser::getTenantId, tenantId));
        if (user == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "user not found");
        }
        return user;
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
