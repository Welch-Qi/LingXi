package com.lingxi.opensite.app;

import com.lingxi.opensite.api.dto.OpenSiteDtos.HealthResponse;
import com.lingxi.opensite.api.dto.OpenSiteDtos.KnowledgeSearchRequest;
import com.lingxi.opensite.api.dto.OpenSiteDtos.KnowledgeSearchResponse;
import com.lingxi.opensite.api.dto.OpenSiteDtos.LeadCreateRequest;
import com.lingxi.opensite.api.dto.OpenSiteDtos.LeadCreateResponse;
import com.lingxi.opensite.api.dto.OpenSiteDtos.OrderStatusPatchRequest;
import com.lingxi.opensite.api.dto.OpenSiteDtos.OrderUpsertRequest;
import com.lingxi.opensite.api.dto.OpenSiteDtos.OrderUpsertResponse;
import com.lingxi.opensite.api.dto.OpenSiteDtos.ProductPage;
import com.lingxi.opensite.config.OpenSiteProperties;
import com.lingxi.opensite.domain.SiteBinding;
import com.lingxi.opensite.domain.SiteContext;
import com.lingxi.opensite.web.SiteContextInterceptor;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.Result;
import jakarta.validation.Valid;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 触点开放 API：/api/v1/open/site/**
 */
@RestController
@RequestMapping("/api/v1/open/site")
public class OpenSiteController {

    private final OpenSiteFacade facade;
    private final OpenSiteProperties properties;

    public OpenSiteController(OpenSiteFacade facade, OpenSiteProperties properties) {
        this.facade = facade;
        this.properties = properties;
    }

    @GetMapping("/health")
    public Result<HealthResponse> health() {
        SiteBinding site = SiteContext.require();
        return Result.ok(new HealthResponse("UP", site.siteId(), site.tenantId(), site.channel()));
    }

    @GetMapping("/products")
    public Result<ProductPage> products(
            @RequestParam(required = false) String updatedAfter,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return Result.ok(facade.listProducts(updatedAfter, pageNo, pageSize));
    }

    @PostMapping("/leads")
    public Result<LeadCreateResponse> createLead(
            @Valid @RequestBody LeadCreateRequest request,
            @RequestHeader(value = SiteContextInterceptor.HEADER_IDEMPOTENCY_KEY, required = false) String idempotencyKey) {
        return Result.ok(facade.createLead(request, requireIdempotency(idempotencyKey)));
    }

    @PostMapping("/orders")
    public Result<OrderUpsertResponse> createOrder(
            @Valid @RequestBody OrderUpsertRequest request,
            @RequestHeader(value = SiteContextInterceptor.HEADER_IDEMPOTENCY_KEY, required = false) String idempotencyKey) {
        return Result.ok(facade.upsertOrder(request, requireIdempotency(idempotencyKey)));
    }

    @PatchMapping("/orders/{siteOrderId}")
    public Result<OrderUpsertResponse> patchOrder(
            @PathVariable String siteOrderId,
            @Valid @RequestBody OrderStatusPatchRequest request,
            @RequestHeader(value = SiteContextInterceptor.HEADER_IDEMPOTENCY_KEY, required = false) String idempotencyKey) {
        return Result.ok(facade.patchOrder(siteOrderId, request, requireIdempotency(idempotencyKey)));
    }

    @PostMapping("/knowledge/search")
    public Result<KnowledgeSearchResponse> searchKnowledge(@Valid @RequestBody KnowledgeSearchRequest request) {
        return Result.ok(facade.searchKnowledge(request));
    }

    private String requireIdempotency(String key) {
        if (properties.isRequireIdempotencyKey() && !StringUtils.hasText(key)) {
            throw new BizException("010004", "X-Idempotency-Key is required");
        }
        return key;
    }
}
