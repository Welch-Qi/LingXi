package com.lingxi.config.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingxi.config.domain.CcIndustry;
import com.lingxi.config.domain.CcPermission;
import com.lingxi.config.domain.CcRole;
import com.lingxi.config.domain.CcSetting;
import com.lingxi.config.domain.CcUser;
import com.lingxi.config.domain.IndustryItem;
import com.lingxi.config.domain.PermissionNode;
import com.lingxi.config.infra.mapper.CcIndustryMapper;
import com.lingxi.config.infra.mapper.CcPermissionMapper;
import com.lingxi.config.infra.mapper.CcRoleMapper;
import com.lingxi.config.infra.mapper.CcSettingMapper;
import com.lingxi.config.infra.mapper.CcUserMapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
public class ConfigController {

    private final CcIndustryMapper industryMapper;
    private final CcSettingMapper settingMapper;
    private final CcUserMapper userMapper;
    private final CcRoleMapper roleMapper;
    private final CcPermissionMapper permissionMapper;
    private final IdGenerator idGenerator;
    private final ObjectMapper objectMapper;

    public ConfigController(
            CcIndustryMapper industryMapper,
            CcSettingMapper settingMapper,
            CcUserMapper userMapper,
            CcRoleMapper roleMapper,
            CcPermissionMapper permissionMapper,
            IdGenerator idGenerator,
            ObjectMapper objectMapper) {
        this.industryMapper = industryMapper;
        this.settingMapper = settingMapper;
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.permissionMapper = permissionMapper;
        this.idGenerator = idGenerator;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/industries")
    public Result<List<CcIndustry>> industries() {
        Long tenantId = resolveTenantId();
        return Result.ok(industryMapper.selectList(new LambdaQueryWrapper<CcIndustry>()
                .eq(CcIndustry::getTenantId, tenantId)
                .orderByAsc(CcIndustry::getIndustryCode)));
    }

    @PutMapping("/industries")
    @RequirePermission("cc:config:manage")
    public Result<List<CcIndustry>> updateIndustries(@RequestBody List<IndustryItem> items) {
        Long tenantId = resolveTenantId();
        industryMapper.delete(new LambdaQueryWrapper<CcIndustry>().eq(CcIndustry::getTenantId, tenantId));
        if (items != null) {
            for (IndustryItem item : items) {
                if (!StringUtils.hasText(item.getIndustryCode()) || !StringUtils.hasText(item.getIndustryName())) {
                    continue;
                }
                CcIndustry row = new CcIndustry();
                row.setId(idGenerator.nextId());
                row.setTenantId(tenantId);
                row.setIndustryCode(item.getIndustryCode().trim());
                row.setIndustryName(item.getIndustryName().trim());
                row.setVersion(0);
                industryMapper.insert(row);
            }
        }
        return industries();
    }

    @GetMapping("/users")
    @RequirePermission("cc:config:manage")
    public Result<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String keyword) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<CcUser> qw = new LambdaQueryWrapper<CcUser>()
                .eq(CcUser::getTenantId, tenantId)
                .orderByDesc(CcUser::getId);
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim();
            qw.and(w -> w.like(CcUser::getDisplayName, kw).or().like(CcUser::getEmail, kw));
        }
        Page<CcUser> page = userMapper.selectPage(new Page<>(pageNo, pageSize), qw);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNo", page.getCurrent());
        data.put("pageSize", page.getSize());
        return Result.ok(data);
    }

    @PostMapping("/users")
    @RequirePermission("cc:config:manage")
    public Result<CcUser> createUser(@RequestBody CcUser body) {
        if (!StringUtils.hasText(body.getEmail())) {
            return Result.fail("BAD_REQUEST", "email is required");
        }
        if (!StringUtils.hasText(body.getDisplayName())) {
            return Result.fail("BAD_REQUEST", "displayName is required");
        }
        Long tenantId = resolveTenantId();
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("USR"));
        }
        if (body.getIsActive() == null) {
            body.setIsActive(true);
        }
        body.setVersion(0);
        userMapper.insert(body);
        return Result.ok(body);
    }

    @PutMapping("/users/{id}")
    @RequirePermission("cc:config:manage")
    public Result<CcUser> updateUser(@PathVariable Long id, @RequestBody CcUser body) {
        CcUser existing = requireUser(resolveTenantId(), id);
        if (StringUtils.hasText(body.getDisplayName())) {
            existing.setDisplayName(body.getDisplayName());
        }
        if (StringUtils.hasText(body.getEmail())) {
            existing.setEmail(body.getEmail());
        }
        if (body.getPhone() != null) {
            existing.setPhone(body.getPhone());
        }
        if (body.getDepartment() != null) {
            existing.setDepartment(body.getDepartment());
        }
        if (body.getTitle() != null) {
            existing.setTitle(body.getTitle());
        }
        if (body.getIsActive() != null) {
            existing.setIsActive(body.getIsActive());
        }
        userMapper.updateById(existing);
        return Result.ok(existing);
    }

    @GetMapping("/roles")
    @RequirePermission("cc:config:manage")
    public Result<Map<String, Object>> listRoles(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String keyword) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<CcRole> qw = new LambdaQueryWrapper<CcRole>()
                .eq(CcRole::getTenantId, tenantId)
                .orderByDesc(CcRole::getId);
        if (StringUtils.hasText(keyword)) {
            qw.like(CcRole::getName, keyword.trim());
        }
        Page<CcRole> page = roleMapper.selectPage(new Page<>(pageNo, pageSize), qw);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNo", page.getCurrent());
        data.put("pageSize", page.getSize());
        return Result.ok(data);
    }

    @PostMapping("/roles")
    @RequirePermission("cc:config:manage")
    public Result<CcRole> createRole(@RequestBody CcRole body) {
        if (!StringUtils.hasText(body.getName())) {
            return Result.fail("BAD_REQUEST", "name is required");
        }
        Long tenantId = resolveTenantId();
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("ROL"));
        }
        if (body.getIsActive() == null) {
            body.setIsActive(true);
        }
        body.setVersion(0);
        roleMapper.insert(body);
        return Result.ok(body);
    }

    @GetMapping("/permissions")
    @RequirePermission("cc:config:manage")
    public Result<List<PermissionNode>> permissions() {
        Long tenantId = resolveTenantId();
        List<CcPermission> rows = permissionMapper.selectList(new LambdaQueryWrapper<CcPermission>()
                .eq(CcPermission::getTenantId, tenantId)
                .orderByAsc(CcPermission::getSortOrder)
                .orderByAsc(CcPermission::getId));
        List<PermissionNode> nodes = rows.stream().map(PermissionNode::from).toList();
        return Result.ok(nodes);
    }

    @GetMapping("/settings/{key}")
    @RequirePermission("cc:setting:manage")
    public Result<Map<String, Object>> getSetting(@PathVariable String key) {
        Long tenantId = resolveTenantId();
        CcSetting row = settingMapper.selectOne(new LambdaQueryWrapper<CcSetting>()
                .eq(CcSetting::getTenantId, tenantId)
                .eq(CcSetting::getSettingKey, key));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("key", key);
        data.put("value", row == null ? Map.of() : parseJson(row.getSettingValue()));
        return Result.ok(data);
    }

    @PutMapping("/settings/{key}")
    @RequirePermission("cc:setting:manage")
    public Result<Map<String, Object>> putSetting(@PathVariable String key, @RequestBody Map<String, Object> body) {
        if (!StringUtils.hasText(key)) {
            return Result.fail("BAD_REQUEST", "key is required");
        }
        Long tenantId = resolveTenantId();
        Object valueObj = body.containsKey("value") ? body.get("value") : body;
        String json;
        try {
            json = objectMapper.writeValueAsString(valueObj == null ? Map.of() : valueObj);
        } catch (JsonProcessingException e) {
            return Result.fail("BAD_REQUEST", "invalid json value");
        }
        CcSetting existing = settingMapper.selectOne(new LambdaQueryWrapper<CcSetting>()
                .eq(CcSetting::getTenantId, tenantId)
                .eq(CcSetting::getSettingKey, key));
        if (existing == null) {
            CcSetting created = new CcSetting();
            created.setId(idGenerator.nextId());
            created.setTenantId(tenantId);
            created.setSettingKey(key);
            created.setSettingValue(json);
            created.setVersion(0);
            settingMapper.insert(created);
        } else {
            if (existing.getVersion() == null) {
                existing.setVersion(0);
            }
            existing.setSettingValue(json);
            settingMapper.updateById(existing);
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("key", key);
        data.put("value", parseJson(json));
        return Result.ok(data);
    }

    private CcUser requireUser(Long tenantId, Long id) {
        CcUser user = userMapper.selectOne(new LambdaQueryWrapper<CcUser>()
                .eq(CcUser::getId, id)
                .eq(CcUser::getTenantId, tenantId));
        if (user == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "user not found");
        }
        return user;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) {
        if (!StringUtils.hasText(json)) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (JsonProcessingException e) {
            return Map.of("_raw", json);
        }
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
