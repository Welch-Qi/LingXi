package com.lingxi.agent.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;
import com.lingxi.starter.mybatis.type.JsonbStringTypeHandler;

@TableName(value = "ac_agent_run_log", schema = "lingxi_platform")
public class AcAgentRunLog extends BaseEntity {

    private String agentCode;
    private String action;
    private String relatedObject;
    private String status;
    private Integer durationMs;
    /** JSONB as text */
    @TableField(typeHandler = JsonbStringTypeHandler.class)
    private String payload;

    public String getAgentCode() {
        return agentCode;
    }

    public void setAgentCode(String agentCode) {
        this.agentCode = agentCode;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getRelatedObject() {
        return relatedObject;
    }

    public void setRelatedObject(String relatedObject) {
        this.relatedObject = relatedObject;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Integer durationMs) {
        this.durationMs = durationMs;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }
}
