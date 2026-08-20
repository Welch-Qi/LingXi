package com.lingxi.starter.security.permission;

import java.util.List;

/**
 * 权限决策客户端：业务侧统一通过此接口鉴权，实现由 lingxi-iam 提供。
 */
public interface PermissionDecisionClient {

    /**
     * @param subject  用户 ID 或角色主体
     * @param tenantId 租户 ID（域）
     * @param permCode 权限码，如 sal:lead:view
     */
    boolean enforce(String subject, Long tenantId, String permCode);

    /**
     * 用户是否拥有任一角色。
     */
    default boolean hasAnyRole(String subject, Long tenantId, String... roles) {
        if (roles == null || roles.length == 0) {
            return true;
        }
        for (String role : roles) {
            if (enforce(subject, tenantId, "role:" + role)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 列出用户在租户下拥有的所有权限码。
     *
     * @param subject  用户 ID
     * @param tenantId 租户 ID
     * @return 权限码列表（如 ["sal:lead:view","sal:lead:create"]），无权限返回空列表
     */
    List<String> listPermissions(String subject, Long tenantId);
}
