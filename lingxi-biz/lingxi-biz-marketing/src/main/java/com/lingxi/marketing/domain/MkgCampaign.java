package com.lingxi.marketing.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

@TableName(value = "mkg_campaign", schema = "lingxi_biz")
public class MkgCampaign extends BaseEntity {

    private String bizCode;
    private String name;
    private String channels;
    private String budget;
    private Integer spentPct;
    private String roas;
    private String status;
    private String periodLabel;

    public String getBizCode() { return bizCode; }
    public void setBizCode(String bizCode) { this.bizCode = bizCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getChannels() { return channels; }
    public void setChannels(String channels) { this.channels = channels; }
    public String getBudget() { return budget; }
    public void setBudget(String budget) { this.budget = budget; }
    public Integer getSpentPct() { return spentPct; }
    public void setSpentPct(Integer spentPct) { this.spentPct = spentPct; }
    public String getRoas() { return roas; }
    public void setRoas(String roas) { this.roas = roas; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPeriodLabel() { return periodLabel; }
    public void setPeriodLabel(String periodLabel) { this.periodLabel = periodLabel; }
}
