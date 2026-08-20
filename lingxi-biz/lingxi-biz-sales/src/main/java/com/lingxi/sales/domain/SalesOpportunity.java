package com.lingxi.sales.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

import java.time.LocalDate;
import java.util.List;

@TableName(value = "sales_opportunity", schema = "lingxi_biz")
public class SalesOpportunity extends BaseEntity {

    private static final List<String> STAGE_ORDER = List.of(
            "DISCOVER", "QUALIFY", "PROPOSAL", "QUOTE", "NEGOTIATE", "WON", "LOST");

    private String bizCode;
    private String name;
    private Long customerId;
    private Long leadId;
    private String stage;
    private Long amountMinor;
    private String currency;
    private Long ownerUserId;
    private LocalDate expectedClose;
    private String lostReason;

    public String getBizCode() {
        return bizCode;
    }

    public void setBizCode(String bizCode) {
        this.bizCode = bizCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public Long getAmountMinor() {
        return amountMinor;
    }

    public void setAmountMinor(Long amountMinor) {
        this.amountMinor = amountMinor;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public LocalDate getExpectedClose() {
        return expectedClose;
    }

    public void setExpectedClose(LocalDate expectedClose) {
        this.expectedClose = expectedClose;
    }

    public String getLostReason() {
        return lostReason;
    }

    public void setLostReason(String lostReason) {
        this.lostReason = lostReason;
    }

    /**
     * 商机阶段流转（领域方法）。状态流转必须经此方法。
     * 合法流转：DISCOVER -> QUALIFY -> PROPOSAL -> QUOTE -> NEGOTIATE -> WON/LOST
     * WON/LOST 为终态，不可再流转
     */
    public void advanceTo(String targetStage) {
        if (targetStage == null || !STAGE_ORDER.contains(targetStage)) {
            throw new IllegalArgumentException("unsupported stage: " + targetStage);
        }
        String current = stage == null ? "DISCOVER" : stage;
        if ("WON".equals(current) || "LOST".equals(current)) {
            throw new IllegalArgumentException("cannot transition from terminal stage: " + current);
        }
        if ("WON".equals(targetStage) || "LOST".equals(targetStage)) {
            if (!"NEGOTIATE".equals(current)) {
                throw new IllegalArgumentException(
                        "WON/LOST only allowed from NEGOTIATE, current: " + current);
            }
        } else {
            int currentIdx = STAGE_ORDER.indexOf(current);
            int targetIdx = STAGE_ORDER.indexOf(targetStage);
            if (targetIdx != currentIdx + 1) {
                throw new IllegalArgumentException(
                        "invalid stage transition: " + current + " -> " + targetStage);
            }
        }
        this.stage = targetStage;
    }

    public static String nextStage(String current) {
        int idx = STAGE_ORDER.indexOf(current == null ? "DISCOVER" : current);
        if (idx < 0 || idx >= STAGE_ORDER.size() - 2) {
            return "QUOTE".equals(current) ? "NEGOTIATE" : (idx < 0 ? "QUALIFY" : current);
        }
        return STAGE_ORDER.get(idx + 1);
    }
}
