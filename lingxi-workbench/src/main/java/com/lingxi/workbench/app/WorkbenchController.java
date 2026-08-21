package com.lingxi.workbench.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.decision.domain.DmKpiSnapshot;
import com.lingxi.decision.infra.mapper.DmKpiSnapshotMapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import com.lingxi.workbench.domain.UwInquiryEvent;
import com.lingxi.workbench.domain.UwTask;
import com.lingxi.workbench.infra.mapper.UwInquiryEventMapper;
import com.lingxi.workbench.infra.mapper.UwTaskMapper;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/workbench")
public class WorkbenchController {

    private final DmKpiSnapshotMapper kpiSnapshotMapper;
    private final UwTaskMapper uwTaskMapper;
    private final UwInquiryEventMapper inquiryEventMapper;
    private final IdGenerator idGenerator;

    public WorkbenchController(
            DmKpiSnapshotMapper kpiSnapshotMapper,
            UwTaskMapper uwTaskMapper,
            UwInquiryEventMapper inquiryEventMapper,
            IdGenerator idGenerator) {
        this.kpiSnapshotMapper = kpiSnapshotMapper;
        this.uwTaskMapper = uwTaskMapper;
        this.inquiryEventMapper = inquiryEventMapper;
        this.idGenerator = idGenerator;
    }

    @GetMapping("/dashboard")
    @RequirePermission("uw:home:view")
    public Result<Map<String, Object>> dashboard() {
        UserContext.UserPrincipal principal = UserContext.require();
        Long tenantId = resolveTenantId();
        long kpiCount = kpiSnapshotMapper.selectCount(new LambdaQueryWrapper<DmKpiSnapshot>()
                .eq(DmKpiSnapshot::getTenantId, tenantId));

        List<UwTask> openTasks = listOpenTasks(tenantId, principal);
        long newInquiries = inquiryEventMapper.selectCount(new LambdaQueryWrapper<UwInquiryEvent>()
                .eq(UwInquiryEvent::getTenantId, tenantId)
                .eq(UwInquiryEvent::getStatus, "NEW"));

        List<Map<String, Object>> taskViews = new ArrayList<>();
        for (UwTask t : openTasks) {
            taskViews.add(toTaskView(t));
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userId", principal.getUserId());
        data.put("displayName", principal.getDisplayName());
        data.put("roles", principal.getRoles());
        data.put("dataScope", principal.getDataScope().name());
        data.put("kpiCount", kpiCount);
        data.put("taskCount", openTasks.size());
        data.put("inquiryCount", newInquiries);
        data.put("tasks", taskViews);
        data.put("summary", roleSummary(principal, openTasks.size(), newInquiries));
        return Result.ok(data);
    }

    @GetMapping("/tasks")
    @RequirePermission("uw:home:view")
    public Result<Map<String, Object>> tasks(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean mineOnly) {
        Long tenantId = resolveTenantId();
        UserContext.UserPrincipal principal = UserContext.require();
        LambdaQueryWrapper<UwTask> qw = new LambdaQueryWrapper<UwTask>()
                .eq(UwTask::getTenantId, tenantId)
                .orderByDesc(UwTask::getPriority)
                .orderByAsc(UwTask::getDueAt);
        if (StringUtils.hasText(status)) {
            qw.eq(UwTask::getStatus, status.trim().toUpperCase(Locale.ROOT));
        }
        if (mineOnly) {
            Long uid = parseUserId(principal.getUserId());
            if (uid != null) {
                qw.eq(UwTask::getAssigneeId, uid);
            }
        }
        List<UwTask> list = uwTaskMapper.selectList(qw.last("LIMIT 100"));
        List<Map<String, Object>> views = new ArrayList<>();
        for (UwTask t : list) {
            views.add(toTaskView(t));
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", views);
        data.put("total", views.size());
        return Result.ok(data);
    }

    @PostMapping("/tasks")
    @RequirePermission("uw:home:view")
    public Result<UwTask> createTask(@RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        String title = body.get("title") == null ? null : String.valueOf(body.get("title")).trim();
        if (!StringUtils.hasText(title)) {
            return Result.fail("BAD_REQUEST", "title is required");
        }
        UwTask task = new UwTask();
        task.setId(idGenerator.nextId());
        task.setTenantId(tenantId);
        task.setBizCode(idGenerator.nextBizCode("TASK"));
        task.setTitle(title);
        task.setTaskType(body.get("taskType") == null ? "GENERAL" : String.valueOf(body.get("taskType")));
        task.setStatus("OPEN");
        Object priority = body.get("priority");
        task.setPriority(priority instanceof Number n ? n.intValue() : 50);
        Object assignee = body.get("assigneeId");
        if (assignee != null) {
            task.setAssigneeId(Long.valueOf(assignee.toString()));
        } else {
            task.setAssigneeId(parseUserId(UserContext.require().getUserId()));
        }
        if (body.get("dueAt") != null) {
            task.setDueAt(Instant.parse(String.valueOf(body.get("dueAt"))));
        }
        uwTaskMapper.insert(task);
        return Result.ok(task);
    }

    @PatchMapping("/tasks/{id}")
    @RequirePermission("uw:home:view")
    public Result<UwTask> updateTask(@PathVariable Long id, @RequestBody @Validated UpdateTaskRequest request) {
        Long tenantId = resolveTenantId();
        UwTask task = uwTaskMapper.selectOne(new LambdaQueryWrapper<UwTask>()
                .eq(UwTask::getId, id).eq(UwTask::getTenantId, tenantId));
        if (task == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "task not found");
        }
        if (request.status() != null) {
            task.setStatus(request.status().trim().toUpperCase(Locale.ROOT));
            if ("DONE".equals(task.getStatus())) {
                task.setCompletedAt(Instant.now());
            }
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.assigneeId() != null) {
            task.setAssigneeId(request.assigneeId());
        }
        if (request.dueAt() != null) {
            task.setDueAt(request.dueAt());
        }
        uwTaskMapper.updateById(task);
        return Result.ok(task);
    }

    @PostMapping("/tasks/{id}/complete")
    @RequirePermission("uw:home:view")
    public Result<UwTask> completeTask(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        UwTask task = uwTaskMapper.selectOne(new LambdaQueryWrapper<UwTask>()
                .eq(UwTask::getId, id).eq(UwTask::getTenantId, tenantId));
        if (task == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "task not found");
        }
        task.setStatus("DONE");
        task.setCompletedAt(Instant.now());
        uwTaskMapper.updateById(task);
        return Result.ok(task);
    }

    @GetMapping("/inquiries")
    @RequirePermission("uw:home:view")
    public Result<Map<String, Object>> inquiries(@RequestParam(required = false) String status) {
        Long tenantId = resolveTenantId();
        LambdaQueryWrapper<UwInquiryEvent> qw = new LambdaQueryWrapper<UwInquiryEvent>()
                .eq(UwInquiryEvent::getTenantId, tenantId)
                .orderByDesc(UwInquiryEvent::getId);
        if (StringUtils.hasText(status)) {
            qw.eq(UwInquiryEvent::getStatus, status.trim().toUpperCase(Locale.ROOT));
        }
        List<UwInquiryEvent> list = inquiryEventMapper.selectList(qw.last("LIMIT 100"));
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("list", list);
        data.put("total", list.size());
        return Result.ok(data);
    }

    @PostMapping("/inquiries/{id}/acknowledge")
    @RequirePermission("uw:home:view")
    public Result<UwInquiryEvent> acknowledgeInquiry(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        UwInquiryEvent event = inquiryEventMapper.selectOne(new LambdaQueryWrapper<UwInquiryEvent>()
                .eq(UwInquiryEvent::getId, id).eq(UwInquiryEvent::getTenantId, tenantId));
        if (event == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "inquiry not found");
        }
        event.setStatus("ACKED");
        event.setAcknowledgedBy(parseUserId(UserContext.require().getUserId()));
        event.setAcknowledgedAt(Instant.now());
        inquiryEventMapper.updateById(event);
        return Result.ok(event);
    }

    private List<UwTask> listOpenTasks(Long tenantId, UserContext.UserPrincipal principal) {
        Long uid = parseUserId(principal.getUserId());
        LambdaQueryWrapper<UwTask> qw = new LambdaQueryWrapper<UwTask>()
                .eq(UwTask::getTenantId, tenantId)
                .eq(UwTask::getStatus, "OPEN")
                .orderByDesc(UwTask::getPriority)
                .orderByAsc(UwTask::getDueAt)
                .last("LIMIT 20");
        if (uid != null && !isAdmin(principal)) {
            qw.and(w -> w.eq(UwTask::getAssigneeId, uid).or().isNull(UwTask::getAssigneeId));
        }
        return uwTaskMapper.selectList(qw);
    }

    private static boolean isAdmin(UserContext.UserPrincipal principal) {
        return principal.getRoles().stream()
                .anyMatch(r -> r.toLowerCase(Locale.ROOT).contains("admin"));
    }

    private static Map<String, Object> toTaskView(UwTask t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", String.valueOf(t.getId()));
        m.put("bizCode", t.getBizCode());
        m.put("title", t.getTitle());
        m.put("status", t.getStatus());
        m.put("taskType", t.getTaskType());
        m.put("priority", t.getPriority());
        m.put("assigneeId", t.getAssigneeId());
        m.put("assignee", t.getAssigneeId() == null ? null : String.valueOf(t.getAssigneeId()));
        m.put("dueAt", t.getDueAt());
        m.put("sourceType", t.getSourceType());
        m.put("sourceId", t.getSourceId());
        return m;
    }

    private String roleSummary(UserContext.UserPrincipal principal, int tasks, long inquiries) {
        return "今日待办 " + tasks + " · 未确认询盘 " + inquiries
                + "（角色：" + String.join(",", principal.getRoles()) + "）";
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
