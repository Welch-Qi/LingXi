package com.lingxi.knowledge.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.knowledge.domain.KcPrompt;
import com.lingxi.knowledge.domain.KcScript;
import com.lingxi.knowledge.domain.KcTemplate;
import com.lingxi.knowledge.infra.mapper.KcPromptMapper;
import com.lingxi.knowledge.infra.mapper.KcScriptMapper;
import com.lingxi.knowledge.infra.mapper.KcTemplateMapper;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/knowledge")
public class KnowledgeController {

    private final KcTemplateMapper templateMapper;
    private final KcScriptMapper scriptMapper;
    private final KcPromptMapper promptMapper;
    private final IdGenerator idGenerator;

    public KnowledgeController(
            KcTemplateMapper templateMapper,
            KcScriptMapper scriptMapper,
            KcPromptMapper promptMapper,
            IdGenerator idGenerator) {
        this.templateMapper = templateMapper;
        this.scriptMapper = scriptMapper;
        this.promptMapper = promptMapper;
        this.idGenerator = idGenerator;
    }

    @GetMapping("/templates")
    @RequirePermission("kc:knowledge:manage")
    public Result<List<KcTemplate>> templates() {
        Long tenantId = resolveTenantId();
        return Result.ok(templateMapper.selectList(new LambdaQueryWrapper<KcTemplate>()
                .eq(KcTemplate::getTenantId, tenantId)
                .orderByDesc(KcTemplate::getId)));
    }

    @PostMapping("/templates")
    @RequirePermission("kc:knowledge:manage")
    public Result<KcTemplate> createTemplate(@RequestBody KcTemplate body) {
        if (!StringUtils.hasText(body.getName()) || !StringUtils.hasText(body.getBody())) {
            return Result.fail("BAD_REQUEST", "name and body are required");
        }
        Long tenantId = resolveTenantId();
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("TPL"));
        }
        if (!StringUtils.hasText(body.getLocale())) {
            body.setLocale("zh-CN");
        }
        templateMapper.insert(body);
        return Result.ok(body);
    }

    @PutMapping("/templates/{id}")
    @RequirePermission("kc:knowledge:manage")
    public Result<KcTemplate> updateTemplate(@PathVariable Long id, @RequestBody KcTemplate body) {
        KcTemplate existing = requireTemplate(resolveTenantId(), id);
        if (StringUtils.hasText(body.getName())) {
            existing.setName(body.getName());
        }
        if (body.getCategory() != null) {
            existing.setCategory(body.getCategory());
        }
        if (body.getLocale() != null) {
            existing.setLocale(body.getLocale());
        }
        if (body.getBody() != null) {
            existing.setBody(body.getBody());
        }
        templateMapper.updateById(existing);
        return Result.ok(existing);
    }

    @DeleteMapping("/templates/{id}")
    @RequirePermission("kc:knowledge:manage")
    public Result<Map<String, Object>> deleteTemplate(@PathVariable Long id) {
        requireTemplate(resolveTenantId(), id);
        templateMapper.deleteById(id);
        return Result.ok(Map.of("deleted", true, "id", id));
    }

    @GetMapping("/scripts")
    @RequirePermission("kc:knowledge:manage")
    public Result<List<KcScript>> scripts() {
        Long tenantId = resolveTenantId();
        return Result.ok(scriptMapper.selectList(new LambdaQueryWrapper<KcScript>()
                .eq(KcScript::getTenantId, tenantId)
                .orderByDesc(KcScript::getId)));
    }

    @PostMapping("/scripts")
    @RequirePermission("kc:knowledge:manage")
    public Result<KcScript> createScript(@RequestBody KcScript body) {
        if (!StringUtils.hasText(body.getScene()) || !StringUtils.hasText(body.getBody())) {
            return Result.fail("BAD_REQUEST", "scene and body are required");
        }
        Long tenantId = resolveTenantId();
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("SCR"));
        }
        if (!StringUtils.hasText(body.getLocale())) {
            body.setLocale("zh-CN");
        }
        scriptMapper.insert(body);
        return Result.ok(body);
    }

    @PutMapping("/scripts/{id}")
    @RequirePermission("kc:knowledge:manage")
    public Result<KcScript> updateScript(@PathVariable Long id, @RequestBody KcScript body) {
        KcScript existing = requireScript(resolveTenantId(), id);
        if (StringUtils.hasText(body.getScene())) {
            existing.setScene(body.getScene());
        }
        if (body.getLocale() != null) {
            existing.setLocale(body.getLocale());
        }
        if (body.getBody() != null) {
            existing.setBody(body.getBody());
        }
        scriptMapper.updateById(existing);
        return Result.ok(existing);
    }

    @DeleteMapping("/scripts/{id}")
    @RequirePermission("kc:knowledge:manage")
    public Result<Map<String, Object>> deleteScript(@PathVariable Long id) {
        requireScript(resolveTenantId(), id);
        scriptMapper.deleteById(id);
        return Result.ok(Map.of("deleted", true, "id", id));
    }

    @GetMapping("/prompts")
    @RequirePermission("kc:knowledge:manage")
    public Result<List<KcPrompt>> prompts() {
        Long tenantId = resolveTenantId();
        return Result.ok(promptMapper.selectList(new LambdaQueryWrapper<KcPrompt>()
                .eq(KcPrompt::getTenantId, tenantId)
                .orderByAsc(KcPrompt::getPromptCode)));
    }

    @PostMapping("/prompts")
    @RequirePermission("kc:knowledge:manage")
    public Result<KcPrompt> createPrompt(@RequestBody KcPrompt body) {
        if (!StringUtils.hasText(body.getName()) || !StringUtils.hasText(body.getBody())) {
            return Result.fail("BAD_REQUEST", "name and body are required");
        }
        Long tenantId = resolveTenantId();
        body.setId(idGenerator.nextId());
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getPromptCode())) {
            String slug = body.getName().trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", ".");
            body.setPromptCode("prompt." + slug + ".v1");
        }
        if (!StringUtils.hasText(body.getVersionLabel())) {
            body.setVersionLabel("v1");
        }
        promptMapper.insert(body);
        return Result.ok(body);
    }

    @PutMapping("/prompts/{id}")
    @RequirePermission("kc:knowledge:manage")
    public Result<KcPrompt> updatePrompt(@PathVariable Long id, @RequestBody KcPrompt body) {
        KcPrompt existing = requirePrompt(resolveTenantId(), id);
        if (StringUtils.hasText(body.getName())) {
            existing.setName(body.getName());
        }
        if (body.getAgentDomain() != null) {
            existing.setAgentDomain(body.getAgentDomain());
        }
        if (body.getBody() != null) {
            existing.setBody(body.getBody());
        }
        if (body.getVersionLabel() != null) {
            existing.setVersionLabel(body.getVersionLabel());
        }
        promptMapper.updateById(existing);
        return Result.ok(existing);
    }

    @DeleteMapping("/prompts/{id}")
    @RequirePermission("kc:knowledge:manage")
    public Result<Map<String, Object>> deletePrompt(@PathVariable Long id) {
        requirePrompt(resolveTenantId(), id);
        promptMapper.deleteById(id);
        return Result.ok(Map.of("deleted", true, "id", id));
    }

    private KcTemplate requireTemplate(Long tenantId, Long id) {
        KcTemplate row = templateMapper.selectOne(new LambdaQueryWrapper<KcTemplate>()
                .eq(KcTemplate::getId, id).eq(KcTemplate::getTenantId, tenantId));
        if (row == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "template not found");
        }
        return row;
    }

    private KcScript requireScript(Long tenantId, Long id) {
        KcScript row = scriptMapper.selectOne(new LambdaQueryWrapper<KcScript>()
                .eq(KcScript::getId, id).eq(KcScript::getTenantId, tenantId));
        if (row == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "script not found");
        }
        return row;
    }

    private KcPrompt requirePrompt(Long tenantId, Long id) {
        KcPrompt row = promptMapper.selectOne(new LambdaQueryWrapper<KcPrompt>()
                .eq(KcPrompt::getId, id).eq(KcPrompt::getTenantId, tenantId));
        if (row == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "prompt not found");
        }
        return row;
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }
}
