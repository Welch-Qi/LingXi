package com.lingxi.mdata.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

@TableName(value = "dc_channel", schema = "lingxi_core")
public class DcChannel extends BaseEntity {

    private String bizCode;
    private String name;
    private String channelType;
    private String coverRegion;
    private String status;

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

    public String getChannelType() {
        return channelType;
    }

    public void setChannelType(String channelType) {
        this.channelType = channelType;
    }

    public String getCoverRegion() {
        return coverRegion;
    }

    public void setCoverRegion(String coverRegion) {
        this.coverRegion = coverRegion;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
