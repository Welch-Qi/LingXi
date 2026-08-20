package com.lingxi.config.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingxi.config.domain.CcIndustry;
import com.lingxi.config.domain.CcSetting;
import com.lingxi.config.infra.mapper.CcIndustryMapper;
import com.lingxi.config.infra.mapper.CcSettingMapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/config")
public class ConfigController {

    private final CcIndustryMapper industryMapper;
    private final CcSettingMapper settingMapper;
    private final IdGenerator idGenerator;
    private final ObjectMapper objectMapper;

    public ConfigController(
            CcIndustryMapper industryMapper,
            CcSettingMapper settingMapper,
            IdGenerator idGenerator,
            ObjectMapper objectMapper) {
        this.industryMapper = industryMapper;
        this.settingMapper = settingMapper;
        this.idGenerator = idGenerator;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/industry")
    public Result<List<CcIndustry>> industry() {
        Long tenantId = resolveTenantId();
        return Result.ok(industryMapper.selectList(new LambdaQueryWrapper<CcIndustry>()
                .eq(CcIndustry::getTenantId, tenantId)
                .orderByAsc(CcIndustry::getIndustryCode)));
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
