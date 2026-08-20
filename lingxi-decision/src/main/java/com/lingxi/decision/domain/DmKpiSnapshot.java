package com.lingxi.decision.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;
import com.lingxi.starter.mybatis.type.JsonbStringTypeHandler;

import java.math.BigDecimal;

@TableName(value = "dm_kpi_snapshot", schema = "lingxi_biz")
public class DmKpiSnapshot extends BaseEntity {

    private String metricCode;
    private String metricName;
    private BigDecimal metricValue;
    private String unit;
    private String periodKey;
    /** JSONB as text */
    @TableField(typeHandler = JsonbStringTypeHandler.class)
    private String dimensions;

    public String getMetricCode() {
        return metricCode;
    }

    public void setMetricCode(String metricCode) {
        this.metricCode = metricCode;
    }

    public String getMetricName() {
        return metricName;
    }

    public void setMetricName(String metricName) {
        this.metricName = metricName;
    }

    public BigDecimal getMetricValue() {
        return metricValue;
    }

    public void setMetricValue(BigDecimal metricValue) {
        this.metricValue = metricValue;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getPeriodKey() {
        return periodKey;
    }

    public void setPeriodKey(String periodKey) {
        this.periodKey = periodKey;
    }

    public String getDimensions() {
        return dimensions;
    }

    public void setDimensions(String dimensions) {
        this.dimensions = dimensions;
    }
}
