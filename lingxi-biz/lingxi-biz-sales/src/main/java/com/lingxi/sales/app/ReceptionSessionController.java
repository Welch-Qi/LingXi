package com.lingxi.sales.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.sales.domain.SalesLead;
import com.lingxi.sales.domain.SalesReceptionMessage;
import com.lingxi.sales.domain.SalesReceptionSession;
import com.lingxi.sales.infra.mapper.SalesLeadMapper;
import com.lingxi.sales.infra.mapper.SalesReceptionMessageMapper;
import com.lingxi.sales.infra.mapper.SalesReceptionSessionMapper;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/sales/sessions")
public class ReceptionSessionController {

    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.of("Asia/Shanghai"));

    private final SalesReceptionSessionMapper sessionMapper;
    private final SalesReceptionMessageMapper messageMapper;
    private final SalesLeadMapper salesLeadMapper;
    private final IdGenerator idGenerator;

    public ReceptionSessionController(
            SalesReceptionSessionMapper sessionMapper,
            SalesReceptionMessageMapper messageMapper,
            SalesLeadMapper salesLeadMapper,
            IdGenerator idGenerator) {
        this.sessionMapper = sessionMapper;
        this.messageMapper = messageMapper;
        this.salesLeadMapper = salesLeadMapper;
        this.idGenerator = idGenerator;
    }

    @GetMapping
    @RequirePermission("sal:session:view")
    public Result<List<Map<String, Object>>> list() {
        Long tenantId = resolveTenantId();
        List<SalesReceptionSession> sessions = sessionMapper.selectList(
                new LambdaQueryWrapper<SalesReceptionSession>()
                        .eq(SalesReceptionSession::getTenantId, tenantId)
                        .orderByDesc(SalesReceptionSession::getUpdatedAt)
                        .orderByDesc(SalesReceptionSession::getId));
        List<Map<String, Object>> data = sessions.stream().map(this::toSessionView).collect(Collectors.toList());
        return Result.ok(data);
    }

    @GetMapping("/{id}/messages")
    @RequirePermission("sal:session:view")
    public Result<List<Map<String, Object>>> messages(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        requireSession(tenantId, id);
        List<SalesReceptionMessage> msgs = messageMapper.selectList(
                new LambdaQueryWrapper<SalesReceptionMessage>()
                        .eq(SalesReceptionMessage::getTenantId, tenantId)
                        .eq(SalesReceptionMessage::getSessionId, id)
                        .orderByAsc(SalesReceptionMessage::getSentAt)
                        .orderByAsc(SalesReceptionMessage::getId));
        List<Map<String, Object>> data = msgs.stream().map(this::toMessageView).collect(Collectors.toList());
        return Result.ok(data);
    }

    @PostMapping("/{id}/messages")
    @RequirePermission("sal:session:message")
    public Result<Map<String, Object>> postMessage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        SalesReceptionSession session = requireSession(tenantId, id);
        String text = text(body.get("body"));
        if (!StringUtils.hasText(text)) {
            text = text(body.get("text"));
        }
        if (!StringUtils.hasText(text)) {
            return Result.fail("BAD_REQUEST", "body is required");
        }
        String senderType = text(body.get("senderType"));
        if (!StringUtils.hasText(senderType)) {
            senderType = "agent";
        }
        senderType = senderType.toLowerCase(Locale.ROOT);
        if (!"agent".equals(senderType) && !"customer".equals(senderType)) {
            senderType = "agent";
        }

        SalesReceptionMessage msg = new SalesReceptionMessage();
        msg.setId(idGenerator.nextId());
        msg.setTenantId(tenantId);
        msg.setSessionId(id);
        msg.setSenderType(senderType);
        msg.setBody(text);
        msg.setSentAt(Instant.now());
        msg.setVersion(0);
        messageMapper.insert(msg);

        session.setLastSummary(text.length() > 80 ? text.substring(0, 80) + "…" : text);
        session.setWaiting("在线 · 刚刚");
        if ("customer".equals(senderType)) {
            int unread = session.getUnreadCount() == null ? 0 : session.getUnreadCount();
            session.setUnreadCount(unread + 1);
        } else {
            session.setUnreadCount(0);
        }
        if (session.getVersion() == null) {
            session.setVersion(0);
        }
        sessionMapper.updateById(session);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("message", toMessageView(msg));
        data.put("session", toSessionView(session));
        return Result.ok(data);
    }

    @PostMapping("/{id}/conversion")
    @RequirePermission("sal:session:convert")
    public Result<Map<String, Object>> convert(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        SalesReceptionSession session = requireSession(tenantId, id);
        if (session.getLeadId() != null) {
            SalesLead existing = salesLeadMapper.selectById(session.getLeadId());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("created", false);
            data.put("lead", existing);
            data.put("session", toSessionView(session));
            data.put("hint", "already converted");
            return Result.ok(data);
        }

        String company = body != null ? text(body.get("companyName")) : null;
        if (!StringUtils.hasText(company)) {
            company = session.getContactName() + " · " + (session.getMarket() != null ? session.getMarket() : "询盘");
        }

        SalesLead lead = new SalesLead();
        long leadId = idGenerator.nextId();
        lead.setId(leadId);
        lead.setTenantId(tenantId);
        lead.setBizCode(idGenerator.nextBizCode("LEAD"));
        lead.setContactName(session.getContactName());
        lead.setCompanyName(company);
        lead.setCountry(session.getMarket());
        lead.setSourceChannel(session.getSource() != null ? session.getSource().toUpperCase(Locale.ROOT) : "RECEPTION");
        lead.setRemark(session.getLastSummary());
        lead.setStatus("ASSIGNED");
        lead.setScore(intentScore(session.getIntentLevel()));
        lead.setOwnerUserId(parseUserId(UserContext.require().getUserId()));
        lead.setClaimedAt(Instant.now());
        lead.setVersion(0);
        if (body != null) {
            if (StringUtils.hasText(text(body.get("email")))) {
                lead.setEmail(text(body.get("email")));
            }
            if (StringUtils.hasText(text(body.get("phone")))) {
                lead.setPhone(text(body.get("phone")));
            }
        }
        salesLeadMapper.insert(lead);

        session.setLeadId(leadId);
        session.setUnreadCount(0);
        session.setWaiting("已建档");
        if (session.getVersion() == null) {
            session.setVersion(0);
        }
        sessionMapper.updateById(session);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("created", true);
        data.put("lead", lead);
        data.put("session", toSessionView(session));
        return Result.ok(data);
    }

    private Map<String, Object> toSessionView(SalesReceptionSession s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("bizCode", s.getBizCode());
        m.put("contactName", s.getContactName());
        m.put("avatarText", s.getAvatarText());
        m.put("market", s.getMarket());
        m.put("source", s.getSource());
        m.put("intentLevel", s.getIntentLevel());
        m.put("product", s.getProduct());
        m.put("waiting", s.getWaiting());
        m.put("unreadCount", s.getUnreadCount() == null ? 0 : s.getUnreadCount());
        m.put("lastSummary", s.getLastSummary());
        m.put("leadId", s.getLeadId());
        m.put("customerId", s.getCustomerId());
        return m;
    }

    private Map<String, Object> toMessageView(SalesReceptionMessage msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", msg.getId());
        m.put("sessionId", msg.getSessionId());
        m.put("senderType", msg.getSenderType());
        m.put("body", msg.getBody());
        m.put("sentAt", msg.getSentAt() != null ? msg.getSentAt().toString() : null);
        m.put("time", msg.getSentAt() != null ? TIME_FMT.format(msg.getSentAt()) : "");
        return m;
    }

    private SalesReceptionSession requireSession(Long tenantId, Long id) {
        SalesReceptionSession session = sessionMapper.selectOne(new LambdaQueryWrapper<SalesReceptionSession>()
                .eq(SalesReceptionSession::getId, id)
                .eq(SalesReceptionSession::getTenantId, tenantId));
        if (session == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "session not found");
        }
        return session;
    }

    private static int intentScore(String level) {
        if (level == null) {
            return 50;
        }
        return switch (level) {
            case "高" -> 90;
            case "中" -> 60;
            case "低" -> 30;
            default -> 50;
        };
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }

    private static Long parseUserId(String userId) {
        try {
            return Long.valueOf(userId);
        } catch (Exception e) {
            return null;
        }
    }

    private static String text(Object v) {
        if (v == null) {
            return null;
        }
        String s = String.valueOf(v).trim();
        return s.isEmpty() || "null".equalsIgnoreCase(s) ? null : s;
    }
}
