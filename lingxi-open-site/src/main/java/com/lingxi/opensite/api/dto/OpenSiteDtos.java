package com.lingxi.opensite.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class OpenSiteDtos {

    private OpenSiteDtos() {
    }

    public record ProductView(
            String sourceProductId,
            long sourceVersion,
            String sku,
            String name,
            String currency,
            long priceMinor,
            String status,
            String updatedAt
    ) {
    }

    public record ProductPage(
            List<ProductView> items,
            int pageNo,
            int pageSize,
            long total
    ) {
    }

    public record LeadCreateRequest(
            @NotBlank String sourceChannel,
            String intent,
            String sessionId,
            String sourceProductId,
            String sku,
            @Valid Buyer buyer,
            String note
    ) {
    }

    public record Buyer(
            @Email String email,
            String name,
            String phone,
            String siteUserId
    ) {
    }

    public record LeadCreateResponse(
            String leadId,
            String status
    ) {
    }

    public record OrderItem(
            @NotBlank String sku,
            String sourceProductId,
            @NotNull Integer qty,
            @NotNull Long priceMinor
    ) {
    }

    public record OrderUpsertRequest(
            @NotBlank String siteOrderId,
            @NotBlank String currency,
            @NotNull Long amountMinor,
            @Valid @NotNull Buyer buyer,
            @NotEmpty List<@Valid OrderItem> items,
            @NotBlank String paymentStatus,
            String paidAt,
            String sourceChannel
    ) {
    }

    public record OrderUpsertResponse(
            String orderId,
            String siteOrderId,
            String status
    ) {
    }

    public record OrderStatusPatchRequest(
            @NotBlank String paymentStatus,
            String paidAt,
            String remark
    ) {
    }

    public record KnowledgeSearchRequest(
            @NotBlank String query,
            Integer topK
    ) {
    }

    public record KnowledgeHit(
            String docId,
            String title,
            String snippet,
            double score
    ) {
    }

    public record KnowledgeSearchResponse(
            List<KnowledgeHit> hits
    ) {
    }

    public record HealthResponse(
            String status,
            String siteId,
            Long tenantId,
            String channel
    ) {
    }
}
