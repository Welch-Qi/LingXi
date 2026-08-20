package com.lingxi.config.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;
import com.lingxi.starter.mybatis.type.JsonbStringTypeHandler;

@TableName(value = "cc_setting", schema = "lingxi_platform")
public class CcSetting extends BaseEntity {

    private String settingKey;
    /** JSONB as text */
    @TableField(typeHandler = JsonbStringTypeHandler.class)
    private String settingValue;

    public String getSettingKey() {
        return settingKey;
    }

    public void setSettingKey(String settingKey) {
        this.settingKey = settingKey;
    }

    public String getSettingValue() {
        return settingValue;
    }

    public void setSettingValue(String settingValue) {
        this.settingValue = settingValue;
    }
}
