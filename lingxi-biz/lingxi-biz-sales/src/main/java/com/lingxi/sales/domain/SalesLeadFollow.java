package com.lingxi.sales.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

import java.time.Instant;

@TableName(value = "sales_lead_follow", schema = "lingxi_biz")
public class SalesLeadFollow extends BaseEntity {

    private Long leadId;
    private String followType;
    private String content;
    private Instant nextFollowAt;
    private Long operatorId;

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public String getFollowType() {
        return followType;
    }

    public void setFollowType(String followType) {
        this.followType = followType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Instant getNextFollowAt() {
        return nextFollowAt;
    }

    public void setNextFollowAt(Instant nextFollowAt) {
        this.nextFollowAt = nextFollowAt;
    }

    public Long getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(Long operatorId) {
        this.operatorId = operatorId;
    }
}
