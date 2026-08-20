package com.lingxi.opensite.app;

import com.lingxi.opensite.api.dto.OpenSiteDtos.KnowledgeHit;
import com.lingxi.opensite.api.dto.OpenSiteDtos.KnowledgeSearchRequest;
import com.lingxi.opensite.api.dto.OpenSiteDtos.KnowledgeSearchResponse;
import com.lingxi.opensite.api.dto.OpenSiteDtos.LeadCreateRequest;
import com.lingxi.opensite.api.dto.OpenSiteDtos.LeadCreateResponse;
import com.lingxi.opensite.api.dto.OpenSiteDtos.OrderStatusPatchRequest;
import com.lingxi.opensite.api.dto.OpenSiteDtos.OrderUpsertRequest;
import com.lingxi.opensite.api.dto.OpenSiteDtos.OrderUpsertResponse;
import com.lingxi.opensite.api.dto.OpenSiteDtos.ProductPage;
import com.lingxi.opensite.api.dto.OpenSiteDtos.ProductView;
import com.lingxi.opensite.domain.SiteBinding;
import com.lingxi.opensite.domain.SiteContext;
import com.lingxi.opensite.domain.SiteErrorCodes;
import com.lingxi.opensite.infra.IdempotencyStore;
import com.lingxi.starter.core.exception.BizException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * P0 开放能力骨架：内存商品/线索/订单，后续对接 MDM / 销售域 / 知识中心。
 */
@Service
public class OpenSiteFacade {

    private final IdempotencyStore idempotencyStore;
    private final List<ProductView> catalog = new ArrayList<>();
    private final Map<String, OrderUpsertResponse> ordersBySiteKey = new ConcurrentHashMap<>();
    private final Map<String, String> orderStatusBySiteKey = new ConcurrentHashMap<>();

    public OpenSiteFacade(IdempotencyStore idempotencyStore) {
        this.idempotencyStore = idempotencyStore;
        catalog.add(new ProductView("P1001", 3, "SKU-EVA-01", "SmartEva Demo Product A",
                "USD", 19900, "on_shelf", "2026-08-01T00:00:00Z"));
        catalog.add(new ProductView("P1002", 1, "SKU-EVA-02", "SmartEva Demo Product B",
                "USD", 9900, "on_shelf", "2026-08-10T12:00:00Z"));
        catalog.add(new ProductView("P1003", 2, "SKU-EVA-03", "SmartEva Demo Product C",
                "USD", 49900, "off_shelf", "2026-08-15T08:00:00Z"));
    }

    public ProductPage listProducts(String updatedAfter, int pageNo, int pageSize) {
        SiteBinding site = SiteContext.require();
        Instant cutoff = null;
        if (StringUtils.hasText(updatedAfter)) {
            cutoff = Instant.parse(updatedAfter);
        }
        Instant finalCutoff = cutoff;
        List<ProductView> filtered = catalog.stream()
                .filter(p -> finalCutoff == null || Instant.parse(p.updatedAt()).isAfter(finalCutoff))
                .sorted(Comparator.comparing(ProductView::updatedAt))
                .collect(Collectors.toList());

        int safePageNo = Math.max(pageNo, 1);
        int safePageSize = Math.min(Math.max(pageSize, 1), 100);
        int from = Math.min((safePageNo - 1) * safePageSize, filtered.size());
        int to = Math.min(from + safePageSize, filtered.size());
        List<ProductView> page = filtered.subList(from, to);
        // 租户隔离占位：P0 演示目录全局共享，正式环境按 site.tenantId 过滤
        if (site.tenantId() == null) {
            throw new BizException(SiteErrorCodes.SITE_TENANT_MISMATCH, "tenant missing");
        }
        return new ProductPage(page, safePageNo, safePageSize, filtered.size());
    }

    public LeadCreateResponse createLead(LeadCreateRequest request, String idempotencyKey) {
        SiteBinding site = SiteContext.require();
        String scope = "lead:" + site.siteId();
        return idempotencyStore.beginOrReplay(scope, idempotencyKey, request, LeadCreateResponse.class, () ->
                new LeadCreateResponse("lead_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12),
                        "accepted"));
    }

    public OrderUpsertResponse upsertOrder(OrderUpsertRequest request, String idempotencyKey) {
        SiteBinding site = SiteContext.require();
        String scope = "order:" + site.siteId();
        return idempotencyStore.beginOrReplay(scope, idempotencyKey, request, OrderUpsertResponse.class, () -> {
            String siteKey = site.siteId() + ":" + request.siteOrderId();
            OrderUpsertResponse existing = ordersBySiteKey.get(siteKey);
            if (existing != null) {
                return existing;
            }
            OrderUpsertResponse created = new OrderUpsertResponse(
                    "ord_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12),
                    request.siteOrderId(),
                    request.paymentStatus());
            ordersBySiteKey.put(siteKey, created);
            orderStatusBySiteKey.put(siteKey, request.paymentStatus());
            return created;
        });
    }

    public OrderUpsertResponse patchOrder(String siteOrderId, OrderStatusPatchRequest request, String idempotencyKey) {
        SiteBinding site = SiteContext.require();
        String siteKey = site.siteId() + ":" + siteOrderId;
        OrderUpsertResponse existing = ordersBySiteKey.get(siteKey);
        if (existing == null) {
            throw new BizException("010005", "order not found: " + siteOrderId);
        }
        String scope = "order-patch:" + siteKey;
        return idempotencyStore.beginOrReplay(scope, idempotencyKey, request, OrderUpsertResponse.class, () -> {
            orderStatusBySiteKey.put(siteKey, request.paymentStatus());
            OrderUpsertResponse updated = new OrderUpsertResponse(existing.orderId(), siteOrderId, request.paymentStatus());
            ordersBySiteKey.put(siteKey, updated);
            return updated;
        });
    }

    public KnowledgeSearchResponse searchKnowledge(KnowledgeSearchRequest request) {
        SiteContext.require();
        int topK = request.topK() == null ? 5 : Math.min(Math.max(request.topK(), 1), 20);
        String q = request.query().toLowerCase();
        List<KnowledgeHit> hits = new ArrayList<>();
        hits.add(new KnowledgeHit("kb_demo_1", "Product FAQ",
                "Demo knowledge hit for query: " + request.query(), q.isBlank() ? 0.5 : 0.82));
        hits.add(new KnowledgeHit("kb_demo_2", "Shipping Policy",
                "Overseas shipping ETA demo snippet.", 0.61));
        return new KnowledgeSearchResponse(hits.stream().limit(topK).toList());
    }
}
