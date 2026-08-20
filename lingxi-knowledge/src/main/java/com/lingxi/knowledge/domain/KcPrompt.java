package com.lingxi.knowledge.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

@TableName(value = "kc_prompt", schema = "lingxi_platform")
public class KcPrompt extends BaseEntity {

    private String promptCode;
    private String name;
    private String agentDomain;
    private String body;
    private String versionLabel;

    public String getPromptCode() {
        return promptCode;
    }

    public void setPromptCode(String promptCode) {
        this.promptCode = promptCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAgentDomain() {
        return agentDomain;
    }

    public void setAgentDomain(String agentDomain) {
        this.agentDomain = agentDomain;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getVersionLabel() {
        return versionLabel;
    }

    public void setVersionLabel(String versionLabel) {
        this.versionLabel = versionLabel;
    }
}
