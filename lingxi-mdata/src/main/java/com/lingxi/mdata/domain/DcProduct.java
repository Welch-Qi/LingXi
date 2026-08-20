package com.lingxi.mdata.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;
import com.lingxi.starter.mybatis.type.JsonbStringTypeHandler;

@TableName(value = "dc_product", schema = "lingxi_core")
public class DcProduct extends BaseEntity {

    private String bizCode;
    private String sku;
    /** JSONB as text */
    @TableField(typeHandler = JsonbStringTypeHandler.class)
    private String nameI18n;
    private String brand;
    private String category;
    private String hsCode;
    private String status;

    public String getBizCode() {
        return bizCode;
    }

    public void setBizCode(String bizCode) {
        this.bizCode = bizCode;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getNameI18n() {
        return nameI18n;
    }

    public void setNameI18n(String nameI18n) {
        this.nameI18n = nameI18n;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getHsCode() {
        return hsCode;
    }

    public void setHsCode(String hsCode) {
        this.hsCode = hsCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
