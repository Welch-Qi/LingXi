package com.lingxi.sales.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

@TableName(value = "sales_reception_session", schema = "lingxi_biz")
public class SalesReceptionSession extends BaseEntity {

    private String bizCode;
    private String contactName;
    private String avatarText;
    private String market;
    private String source;
    private String intentLevel;
    private String product;
    private String waiting;
    private Integer unreadCount;
    private String lastSummary;
    private Long leadId;
    private Long customerId;

    public String getBizCode() { return bizCode; }
    public void setBizCode(String bizCode) { this.bizCode = bizCode; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getAvatarText() { return avatarText; }
    public void setAvatarText(String avatarText) { this.avatarText = avatarText; }
    public String getMarket() { return market; }
    public void setMarket(String market) { this.market = market; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getIntentLevel() { return intentLevel; }
    public void setIntentLevel(String intentLevel) { this.intentLevel = intentLevel; }
    public String getProduct() { return product; }
    public void setProduct(String product) { this.product = product; }
    public String getWaiting() { return waiting; }
    public void setWaiting(String waiting) { this.waiting = waiting; }
    public Integer getUnreadCount() { return unreadCount; }
    public void setUnreadCount(Integer unreadCount) { this.unreadCount = unreadCount; }
    public String getLastSummary() { return lastSummary; }
    public void setLastSummary(String lastSummary) { this.lastSummary = lastSummary; }
    public Long getLeadId() { return leadId; }
    public void setLeadId(Long leadId) { this.leadId = leadId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
}
