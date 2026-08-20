package com.lingxi.sales.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.sales.domain.SalesLead;
import com.lingxi.sales.domain.SalesLeadFollow;
import com.lingxi.sales.infra.mapper.SalesLeadFollowMapper;
import com.lingxi.sales.infra.mapper.SalesLeadMapper;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequireDataScope;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sales/leads")
public class LeadController {

    private final SalesLeadMapper salesLeadMapper;
    private final SalesLeadFollowMapper followMapper;
    private final LeadDedupService leadDedupService;
    private final IdGenerator idGenerator;
    private final JdbcTemplate jdbcTemplate;

    public LeadController(
            SalesLeadMapper salesLeadMapper,
            SalesLeadFollowMapper followMapper,
            LeadDedupService leadDedupService,
            IdGenerator idGenerator,
            JdbcTemplate jdbcTemplate) {
        this.salesLeadMapper = salesLeadMapper;
        this.followMapper = followMapper;
        this.leadDedupService = leadDedupService;
        this.idGenerator = idGenerator;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    @RequirePermission("sal:lead:view")
    @RequireDataScope
    public Result<Map<String, Object>> list(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String status) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<SalesLead> qw = new LambdaQueryWrapper<SalesLead>()
                .eq(SalesLead::getTenantId, tenantId)
                .orderByDesc(SalesLead::getId);
        if (StringUtils.hasText(status)) {
            qw.eq(SalesLead::getStatus, status.trim().toUpperCase(Locale.ROOT));
        }
        Page<SalesLead> page = salesLeadMapper.selectPage(new Page<>(pageNo, pageSize), qw);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNo", page.getCurrent());
        data.put("pageSize", page.getSize());
        return Result.ok(data);
    }

    @GetMapping("/pool")
    @RequirePermission("sal:lead:view")
    @RequireDataScope
    public Result<Map<String, Object>> pool(
            @RequestParam(defaultValue = "1") long pageNo,
            @RequestParam(defaultValue = "20") long pageSize) {
        Long tenantId = resolveTenantId();
        Page<SalesLead> page = salesLeadMapper.selectPage(
                new Page<>(pageNo, pageSize),
                new LambdaQueryWrapper<SalesLead>()
                        .eq(SalesLead::getTenantId, tenantId)
                        .and(w -> w.eq(SalesLead::getStatus, "POOL")
                                .or(x -> x.isNull(SalesLead::getOwnerUserId)
                                        .in(SalesLead::getStatus, "NEW", "POOL")))
                        .orderByDesc(SalesLead::getId));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", page.getRecords());
        data.put("total", page.getTotal());
        data.put("pageNo", page.getCurrent());
        data.put("pageSize", page.getSize());
        return Result.ok(data);
    }

    @PostMapping
    @RequirePermission("sal:lead:create")
    public Result<Map<String, Object>> create(
            @RequestBody SalesLead body,
            @RequestParam(defaultValue = "false") boolean force) {
        Long tenantId = resolveTenantId();
        Map<String, Object> criteria = new LinkedHashMap<>();
        criteria.put("companyName", body.getCompanyName());
        criteria.put("email", body.getEmail());
        criteria.put("phone", body.getPhone());
        criteria.put("website", body.getWebsite());
        criteria.put("domain", body.getDomain());
        Map<String, Object> dedup = leadDedupService.check(tenantId, criteria);
        if (Boolean.TRUE.equals(dedup.get("hasDuplicate")) && !force) {
            Map<String, Object> blocked = new LinkedHashMap<>();
            blocked.put("created", false);
            blocked.put("dedup", dedup);
            blocked.put("hint", "存在疑似重复，确认后可传 force=true");
            return Result.ok(blocked);
        }

        long id = idGenerator.nextId();
        body.setId(id);
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("LEAD"));
        }
        if (!StringUtils.hasText(body.getDomain())) {
            body.setDomain(LeadDedupService.extractDomain(body.getWebsite()));
        }
        if (!StringUtils.hasText(body.getDomain())
                && StringUtils.hasText(body.getEmail())
                && body.getEmail().contains("@")) {
            body.setDomain(body.getEmail().substring(body.getEmail().indexOf('@') + 1).toLowerCase(Locale.ROOT));
        }
        if (!StringUtils.hasText(body.getStatus())) {
            if (body.getOwnerUserId() == null) {
                body.setStatus("POOL");
                body.setPoolAt(Instant.now());
            } else {
                body.setStatus("ASSIGNED");
                body.setClaimedAt(Instant.now());
            }
        }
        if (body.getScore() == null) {
            body.setScore(0);
        }
        salesLeadMapper.insert(body);
        // TODO: 待事件总线基础设施就绪后发布 lx.sal.lead.created 事件

        boolean inquiryLike = isInquirySource(body.getSourceChannel());
        if (inquiryLike) {
            createInquiryAndTask(tenantId, body);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("created", true);
        data.put("lead", body);
        data.put("dedup", dedup);
        return Result.ok(data);
    }

    @PostMapping("/dedup")
    @RequirePermission("sal:lead:view")
    public Result<Map<String, Object>> dedupPost(@RequestBody Map<String, Object> body) {
        return Result.ok(leadDedupService.check(resolveTenantId(), body));
    }

    @GetMapping("/dedup")
    @RequirePermission("sal:lead:view")
    public Result<Map<String, Object>> dedupGet(
            @RequestParam(required = false) String companyName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String website,
            @RequestParam(required = false) String domain) {
        Map<String, Object> criteria = new LinkedHashMap<>();
        criteria.put("companyName", companyName);
        criteria.put("email", email);
        criteria.put("phone", phone);
        criteria.put("website", website);
        criteria.put("domain", domain);
        return Result.ok(leadDedupService.check(resolveTenantId(), criteria));
    }

    @GetMapping("/{id}")
    @RequirePermission("sal:lead:view")
    @RequireDataScope
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        SalesLead lead = requireLead(tenantId, id);
        long followCount = followMapper.selectCount(new LambdaQueryWrapper<SalesLeadFollow>()
                .eq(SalesLeadFollow::getTenantId, tenantId)
                .eq(SalesLeadFollow::getLeadId, id));
        SalesLeadFollow recentFollow = followMapper.selectOne(new LambdaQueryWrapper<SalesLeadFollow>()
                .eq(SalesLeadFollow::getTenantId, tenantId)
                .eq(SalesLeadFollow::getLeadId, id)
                .orderByDesc(SalesLeadFollow::getId)
                .last("LIMIT 1"));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("lead", lead);
        data.put("followCount", followCount);
        if (recentFollow != null) {
            data.put("recentFollow", recentFollow);
        }
        return Result.ok(data);
    }

    @PostMapping("/{id}/assignment")
    @RequirePermission("sal:lead:assign")
    public Result<SalesLead> assign(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        SalesLead lead = requireLead(tenantId, id);
        Object owner = body.get("ownerUserId");
        if (owner != null) {
            lead.setOwnerUserId(Long.valueOf(owner.toString()));
            lead.setStatus("ASSIGNED");
            lead.setClaimedAt(Instant.now());
            lead.setPoolAt(null);
            salesLeadMapper.updateById(lead);
            // TODO: 待事件总线基础设施就绪后发布 lx.sal.lead.assigned 事件
        }
        return Result.ok(lead);
    }

    @PostMapping("/{id}/claim")
    @RequirePermission("sal:lead:assign")
    public Result<SalesLead> claim(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        SalesLead lead = requireLead(tenantId, id);
        Long userId = parseUserId(UserContext.require().getUserId());
        lead.setOwnerUserId(userId);
        lead.setStatus("ASSIGNED");
        lead.setClaimedAt(Instant.now());
        lead.setPoolAt(null);
        salesLeadMapper.updateById(lead);
        return Result.ok(lead);
    }

    @PostMapping("/{id}/release")
    @RequirePermission("sal:lead:assign")
    public Result<SalesLead> release(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        SalesLead lead = requireLead(tenantId, id);
        lead.setOwnerUserId(null);
        lead.setStatus("POOL");
        lead.setPoolAt(Instant.now());
        lead.setClaimedAt(null);
        salesLeadMapper.updateById(lead);
        return Result.ok(lead);
    }

    @GetMapping("/{id}/follows")
    @RequirePermission("sal:lead:view")
    public Result<List<SalesLeadFollow>> follows(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        requireLead(tenantId, id);
        return Result.ok(followMapper.selectList(new LambdaQueryWrapper<SalesLeadFollow>()
                .eq(SalesLeadFollow::getTenantId, tenantId)
                .eq(SalesLeadFollow::getLeadId, id)
                .orderByDesc(SalesLeadFollow::getId)));
    }

    @PostMapping("/{id}/follows")
    @RequirePermission("sal:lead:follow")
    public Result<SalesLeadFollow> addFollow(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        SalesLead lead = requireLead(tenantId, id);
        String content = body.get("content") == null ? "" : String.valueOf(body.get("content")).trim();
        if (!StringUtils.hasText(content)) {
            return Result.fail("BAD_REQUEST", "content is required");
        }
        SalesLeadFollow follow = new SalesLeadFollow();
        follow.setId(idGenerator.nextId());
        follow.setTenantId(tenantId);
        follow.setLeadId(id);
        follow.setFollowType(body.get("followType") == null ? "CALL" : String.valueOf(body.get("followType")));
        follow.setContent(content);
        follow.setOperatorId(parseUserId(UserContext.require().getUserId()));
        if (body.get("nextFollowAt") != null) {
            follow.setNextFollowAt(Instant.parse(String.valueOf(body.get("nextFollowAt"))));
        } else {
            follow.setNextFollowAt(Instant.now().plus(1, ChronoUnit.DAYS));
        }
        followMapper.insert(follow);

        if (lead.getOwnerUserId() != null && !"CONVERTED".equalsIgnoreCase(lead.getStatus())) {
            lead.setStatus("FOLLOWING");
            salesLeadMapper.updateById(lead);
        }
        return Result.ok(follow);
    }

    private void createInquiryAndTask(Long tenantId, SalesLead lead) {
        long inquiryId = idGenerator.nextId();
        String inquiryCode = idGenerator.nextBizCode("INQ");
        jdbcTemplate.update(
                """
                INSERT INTO lingxi_biz.uw_inquiry_event
                (id, tenant_id, biz_code, title, channel, contact_name, contact_email, company_name, lead_id, status,
                 created_at, updated_at, is_deleted, version)
                VALUES (?,?,?,?,?,?,?,?,?,'NEW', NOW(), NOW(), 0, 0)
                """,
                inquiryId,
                tenantId,
                inquiryCode,
                "新询盘：" + lead.getCompanyName(),
                lead.getSourceChannel(),
                lead.getContactName(),
                lead.getEmail(),
                lead.getCompanyName(),
                lead.getId());

        long taskId = idGenerator.nextId();
        String taskCode = idGenerator.nextBizCode("TASK");
        Long assignee = lead.getOwnerUserId() != null
                ? lead.getOwnerUserId()
                : parseUserId(UserContext.require().getUserId());
        jdbcTemplate.update(
                """
                INSERT INTO lingxi_biz.uw_task
                (id, tenant_id, biz_code, title, task_type, status, priority, assignee_id, due_at,
                 source_type, source_id, created_at, updated_at, is_deleted, version)
                VALUES (?,?,?,?, 'INQUIRY', 'OPEN', 80, ?, NOW() + INTERVAL '1 day',
                        'INQUIRY', ?, NOW(), NOW(), 0, 0)
                """,
                taskId,
                tenantId,
                taskCode,
                "跟进询盘：" + lead.getCompanyName(),
                assignee,
                inquiryId);
    }

    private static boolean isInquirySource(String source) {
        if (!StringUtils.hasText(source)) {
            return false;
        }
        String s = source.toUpperCase(Locale.ROOT);
        return s.contains("WEB") || s.contains("INQUIR") || s.contains("MAIL") || s.contains("FORM");
    }

    private SalesLead requireLead(Long tenantId, Long id) {
        SalesLead lead = salesLeadMapper.selectOne(new LambdaQueryWrapper<SalesLead>()
                .eq(SalesLead::getId, id).eq(SalesLead::getTenantId, tenantId));
        if (lead == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "lead not found");
        }
        return lead;
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }

    private static Long parseUserId(String userId) {
        if (!StringUtils.hasText(userId)) {
            return null;
        }
        try {
            return Long.parseLong(userId.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
