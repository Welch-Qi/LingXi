package com.lingxi.marketing.app;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingxi.id.api.IdGenerator;
import com.lingxi.marketing.domain.MkgCampaign;
import com.lingxi.marketing.domain.MkgContentAsset;
import com.lingxi.marketing.domain.MkgPublishJob;
import com.lingxi.marketing.domain.MkgSocialAccount;
import com.lingxi.marketing.infra.mapper.MkgCampaignMapper;
import com.lingxi.marketing.infra.mapper.MkgContentAssetMapper;
import com.lingxi.marketing.infra.mapper.MkgPublishJobMapper;
import com.lingxi.marketing.infra.mapper.MkgSocialAccountMapper;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/marketing")
public class MarketingController {

    private static final Set<String> VALID_PLATFORMS = Set.of(
            "FACEBOOK", "INSTAGRAM", "LINKEDIN", "TIKTOK");

    private final MkgSocialAccountMapper socialAccountMapper;
    private final MkgContentAssetMapper contentAssetMapper;
    private final MkgCampaignMapper campaignMapper;
    private final MkgPublishJobMapper publishJobMapper;
    private final IdGenerator idGenerator;
    private final ContentAgentClient contentAgentClient;
    private final ObjectMapper objectMapper;

    public MarketingController(
            MkgSocialAccountMapper socialAccountMapper,
            MkgContentAssetMapper contentAssetMapper,
            MkgCampaignMapper campaignMapper,
            MkgPublishJobMapper publishJobMapper,
            IdGenerator idGenerator,
            ContentAgentClient contentAgentClient,
            ObjectMapper objectMapper) {
        this.socialAccountMapper = socialAccountMapper;
        this.contentAssetMapper = contentAssetMapper;
        this.campaignMapper = campaignMapper;
        this.publishJobMapper = publishJobMapper;
        this.idGenerator = idGenerator;
        this.contentAgentClient = contentAgentClient;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/social-accounts")
    @RequirePermission("mkg:social:view")
    public Result<List<MkgSocialAccount>> socialAccounts() {
        Long tenantId = resolveTenantId();
        return Result.ok(socialAccountMapper.selectList(new LambdaQueryWrapper<MkgSocialAccount>()
                .eq(MkgSocialAccount::getTenantId, tenantId)
                .orderByAsc(MkgSocialAccount::getPlatform)));
    }

    @PostMapping("/social-accounts")
    @RequirePermission("mkg:social:manage")
    public Result<MkgSocialAccount> bindSocialAccount(@RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        String platform = text(body.get("platform"));
        if (!StringUtils.hasText(platform)) {
            return Result.fail("BAD_REQUEST", "platform is required");
        }
        String normalizedPlatform = platform.toUpperCase();
        if (!VALID_PLATFORMS.contains(normalizedPlatform)) {
            return Result.fail("BAD_REQUEST", "invalid platform: " + platform);
        }
        String accountName = text(body.get("accountName"));
        if (!StringUtils.hasText(accountName)) {
            return Result.fail("BAD_REQUEST", "accountName is required");
        }

        MkgSocialAccount account = new MkgSocialAccount();
        account.setPlatform(normalizedPlatform);
        account.setAccountName(accountName);
        account.setExternalRef(text(body.get("externalRef")));
        account.setAuthStatus("DISCONNECTED");
        prepareNewSocialAccount(account, tenantId);
        socialAccountMapper.insert(account);
        return Result.ok(account);
    }

    @DeleteMapping("/social-accounts/{id}")
    @RequirePermission("mkg:social:manage")
    public Result<Void> unbindSocialAccount(@PathVariable Long id) {
        Long tenantId = resolveTenantId();
        requireSocialAccount(tenantId, id);
        socialAccountMapper.deleteById(id);
        return Result.ok(null);
    }

    @GetMapping("/contents")
    @RequirePermission("mkg:content:generate")
    public Result<List<MkgContentAsset>> contents() {
        Long tenantId = resolveTenantId();
        return Result.ok(contentAssetMapper.selectList(new LambdaQueryWrapper<MkgContentAsset>()
                .eq(MkgContentAsset::getTenantId, tenantId)
                .orderByDesc(MkgContentAsset::getId)));
    }

    @GetMapping("/campaigns")
    @RequirePermission("mkg:social:view")
    public Result<List<MkgCampaign>> campaigns() {
        Long tenantId = resolveTenantId();
        return Result.ok(campaignMapper.selectList(new LambdaQueryWrapper<MkgCampaign>()
                .eq(MkgCampaign::getTenantId, tenantId)
                .orderByDesc(MkgCampaign::getId)));
    }

    @PostMapping("/contents")
    @RequirePermission("mkg:content:generate")
    public Result<MkgContentAsset> createContent(@RequestBody MkgContentAsset body) {
        Long tenantId = resolveTenantId();
        prepareNewAsset(body, tenantId);
        if (!StringUtils.hasText(body.getBody())) {
            return Result.fail("BAD_REQUEST", "body is required; use POST /contents/generate for Agent 生成");
        }
        if (!StringUtils.hasText(body.getStatus())) {
            body.setStatus("DRAFT");
        }
        contentAssetMapper.insert(body);
        return Result.ok(body);
    }

    @PostMapping("/contents/generate")
    @RequirePermission("mkg:content:generate")
    public Result<Map<String, Object>> generate(@RequestBody Map<String, Object> body) {
        return generateContent(body);
    }

    @PostMapping("/ai-content")
    @RequirePermission("mkg:content:generate")
    public Result<Map<String, Object>> aiContent(@RequestBody Map<String, Object> body) {
        return generateContent(body);
    }

    private Result<Map<String, Object>> generateContent(Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        UserContext.UserPrincipal principal = UserContext.require();
        String title = text(body.get("title"));
        if (!StringUtils.hasText(title)) {
            title = text(body.get("topic"));
        }
        if (!StringUtils.hasText(title)) {
            return Result.fail("BAD_REQUEST", "title (or topic) is required");
        }
        String locale = text(body.get("locale"));
        if (!StringUtils.hasText(locale)) {
            locale = "zh-CN";
        }
        String contentType = text(body.get("contentType"));
        if (!StringUtils.hasText(contentType)) {
            contentType = "TEXT";
        }

        Map<String, Object> agent = contentAgentClient.generate(
                title,
                locale,
                String.valueOf(tenantId),
                principal.getUserId());

        boolean fromAgent = Boolean.TRUE.equals(agent.get("ok"));
        String draft = fromAgent ? String.valueOf(agent.get("draft")) : localFallbackDraft(title, locale);
        String source = fromAgent ? "social_marketer" : "local_fallback";

        MkgContentAsset asset = new MkgContentAsset();
        asset.setTitle(title);
        asset.setLocale(locale);
        asset.setContentType(contentType.toUpperCase());
        asset.setBody(draft);
        asset.setStatus("DRAFT");
        asset.setViews(0);
        asset.setLeads(0);
        prepareNewAsset(asset, tenantId);
        contentAssetMapper.insert(asset);

        // TODO: 待事件总线基础设施就绪后发布 lx.mkg.content.generated 事件

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("asset", asset);
        data.put("generatedBy", source);
        data.put("agentStatus", agent.getOrDefault("status", fromAgent ? "completed" : "runtime_unavailable"));
        if (agent.get("taskId") != null) {
            data.put("agentTaskId", agent.get("taskId"));
        }
        if (agent.get("message") != null) {
            data.put("agentMessage", agent.get("message"));
        }
        data.put("promptCode", "prompt.mkg.content.generate.v1");
        return Result.ok(data);
    }

    @PostMapping("/contents/{id}/submit-review")
    @RequirePermission("mkg:content:generate")
    public Result<MkgContentAsset> submitReview(@PathVariable Long id) {
        MkgContentAsset asset = requireContent(resolveTenantId(), id);
        asset.setStatus("PENDING_REVIEW");
        if (asset.getVersion() == null) {
            asset.setVersion(0);
        }
        contentAssetMapper.updateById(asset);
        return Result.ok(asset);
    }

    @PostMapping("/contents/{id}/approve")
    @RequirePermission("mkg:content:generate")
    public Result<MkgContentAsset> approve(@PathVariable Long id) {
        MkgContentAsset asset = requireContent(resolveTenantId(), id);
        asset.setStatus("APPROVED");
        if (asset.getVersion() == null) {
            asset.setVersion(0);
        }
        contentAssetMapper.updateById(asset);
        return Result.ok(asset);
    }

    @PostMapping("/contents/{id}/publish")
    @RequirePermission("mkg:content:generate")
    public Result<Map<String, Object>> publish(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long tenantId = resolveTenantId();
        MkgContentAsset asset = requireContent(tenantId, id);
        Object channelsObj = body.get("channels");
        if (channelsObj == null) {
            return Result.fail("BAD_REQUEST", "channels is required");
        }
        String channelsJson;
        try {
            channelsJson = objectMapper.writeValueAsString(channelsObj);
        } catch (Exception e) {
            return Result.fail("BAD_REQUEST", "invalid channels");
        }
        Instant scheduledAt = Instant.now();
        String scheduledRaw = text(body.get("scheduledAt"));
        if (StringUtils.hasText(scheduledRaw)) {
            try {
                scheduledAt = Instant.parse(scheduledRaw);
            } catch (Exception ignored) {
                // keep now
            }
        }
        MkgPublishJob job = new MkgPublishJob();
        job.setId(idGenerator.nextId());
        job.setTenantId(tenantId);
        job.setContentId(id);
        job.setChannels(channelsJson);
        job.setScheduledAt(scheduledAt);
        job.setDescription(text(body.get("description")));
        job.setKeywords(text(body.get("keywords")));
        boolean immediate = scheduledAt.isBefore(Instant.now().plusSeconds(60));
        job.setStatus(immediate ? "PUBLISHED" : "SCHEDULED");
        job.setVersion(0);
        publishJobMapper.insert(job);

        asset.setStatus(immediate ? "PUBLISHED" : "SCHEDULED");
        if (asset.getVersion() == null) {
            asset.setVersion(0);
        }
        contentAssetMapper.updateById(asset);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("job", job);
        data.put("asset", asset);
        return Result.ok(data);
    }

    private MkgContentAsset requireContent(Long tenantId, Long id) {
        MkgContentAsset asset = contentAssetMapper.selectOne(new LambdaQueryWrapper<MkgContentAsset>()
                .eq(MkgContentAsset::getId, id)
                .eq(MkgContentAsset::getTenantId, tenantId));
        if (asset == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "content not found");
        }
        return asset;
    }

    private MkgSocialAccount requireSocialAccount(Long tenantId, Long id) {
        MkgSocialAccount account = socialAccountMapper.selectOne(new LambdaQueryWrapper<MkgSocialAccount>()
                .eq(MkgSocialAccount::getId, id)
                .eq(MkgSocialAccount::getTenantId, tenantId));
        if (account == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "social account not found");
        }
        return account;
    }

    private void prepareNewSocialAccount(MkgSocialAccount account, Long tenantId) {
        account.setId(idGenerator.nextId());
        account.setTenantId(tenantId);
        if (account.getVersion() == null) {
            account.setVersion(0);
        }
    }

    private void prepareNewAsset(MkgContentAsset body, Long tenantId) {
        long id = idGenerator.nextId();
        body.setId(id);
        body.setTenantId(tenantId);
        if (!StringUtils.hasText(body.getBizCode())) {
            body.setBizCode(idGenerator.nextBizCode("CT"));
        }
        if (!StringUtils.hasText(body.getContentType())) {
            body.setContentType("TEXT");
        }
        if (!StringUtils.hasText(body.getLocale())) {
            body.setLocale("zh-CN");
        }
        if (!StringUtils.hasText(body.getTitle())) {
            body.setTitle("AI 生成内容 " + id);
        }
        if (body.getViews() == null) {
            body.setViews(0);
        }
        if (body.getLeads() == null) {
            body.setLeads(0);
        }
    }

    private static String localFallbackDraft(String title, String locale) {
        return "[" + locale + "][local_fallback] Muse 草稿 · 主题「" + title
                + "」\n\nHook：海外买家正在搜索高可靠储能方案。\n"
                + "卖点：安全认证 · 快速交付 · 本地化支持。\n"
                + "CTA：留言获取产品手册与报价。\n"
                + "（Agent Runtime 未就绪时的兜底文案，可重新生成）";
    }

    private Long resolveTenantId() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = UserContext.require().getTenantId();
        }
        return tenantId;
    }

    private static String text(Object v) {
        if (v == null) {
            return null;
        }
        String s = String.valueOf(v).trim();
        return s.isEmpty() || "null".equalsIgnoreCase(s) ? null : s;
    }
}
