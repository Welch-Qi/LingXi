package com.lingxi.config.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

@TableName(value = "cc_permission", schema = "lingxi_platform")
public class CcPermission extends BaseEntity {

    private String permissionCode;
    private String name;
    private Long parentId;
    private Integer sortOrder;
    private Boolean isActive;

    public String getPermissionCode() {
        return permissionCode;
    }

    public void setPermissionCode(String permissionCode) {
        this.permissionCode = permissionCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
