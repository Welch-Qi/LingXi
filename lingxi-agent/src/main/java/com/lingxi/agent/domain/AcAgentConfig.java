package com.lingxi.agent.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;
import com.lingxi.starter.mybatis.type.JsonbStringTypeHandler;

@TableName(value = "ac_agent_config", schema = "lingxi_platform")
public class AcAgentConfig extends BaseEntity {

    private String agentCode;
    /** JSONB as text */
    @TableField(typeHandler = JsonbStringTypeHandler.class)
    private String configJson;

    public String getAgentCode() {
        return agentCode;
    }

    public void setAgentCode(String agentCode) {
        this.agentCode = agentCode;
    }

    public String getConfigJson() {
        return configJson;
    }

    public void setConfigJson(String configJson) {
        this.configJson = configJson;
    }
}
