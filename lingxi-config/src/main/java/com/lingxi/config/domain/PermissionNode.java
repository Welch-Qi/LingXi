package com.lingxi.config.domain;

public class PermissionNode {

    private Long id;
    private String permissionCode;
    private String name;
    private Long parentId;
    private Integer sortOrder;

    public PermissionNode() {
    }

    public PermissionNode(Long id, String permissionCode, String name, Long parentId, Integer sortOrder) {
        this.id = id;
        this.permissionCode = permissionCode;
        this.name = name;
        this.parentId = parentId;
        this.sortOrder = sortOrder;
    }

    public static PermissionNode from(CcPermission permission) {
        return new PermissionNode(
                permission.getId(),
                permission.getPermissionCode(),
                permission.getName(),
                permission.getParentId(),
                permission.getSortOrder());
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
}
