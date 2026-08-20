package com.lingxi.user.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.lingxi.starter.mybatis.domain.BaseEntity;

@TableName(value = "sys_user", schema = "lingxi_core")
public class SysUser extends BaseEntity {

    private String bizCode;

    private String email;

    private String displayName;

    private String staffType;

    private String department;

    private String title;

    private String phone;

    private String sex;

    private Boolean isActive;

    private String casdoorName;

    public String getBizCode() {
        return bizCode;
    }

    public void setBizCode(String bizCode) {
        this.bizCode = bizCode;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getStaffType() {
        return staffType;
    }

    public void setStaffType(String staffType) {
        this.staffType = staffType;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getCasdoorName() {
        return casdoorName;
    }

    public void setCasdoorName(String casdoorName) {
        this.casdoorName = casdoorName;
    }
}
