package com.lingxi.sales.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

import java.time.Instant;

@TableName(value = "sales_reception_message", schema = "lingxi_biz")
public class SalesReceptionMessage extends BaseEntity {

    private Long sessionId;
    private String senderType;
    private String body;
    private Instant sentAt;

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public String getSenderType() { return senderType; }
    public void setSenderType(String senderType) { this.senderType = senderType; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
}
