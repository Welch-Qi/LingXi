package com.lingxi.marketing.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;
import com.lingxi.starter.mybatis.type.JsonbStringTypeHandler;

import java.time.Instant;

@TableName(value = "mkg_publish_job", schema = "lingxi_biz")
public class MkgPublishJob extends BaseEntity {

    private Long contentId;
    @TableField(typeHandler = JsonbStringTypeHandler.class)
    private String channels;
    private Instant scheduledAt;
    private String description;
    private String keywords;
    private String status;

    public Long getContentId() { return contentId; }
    public void setContentId(Long contentId) { this.contentId = contentId; }
    public String getChannels() { return channels; }
    public void setChannels(String channels) { this.channels = channels; }
    public Instant getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
