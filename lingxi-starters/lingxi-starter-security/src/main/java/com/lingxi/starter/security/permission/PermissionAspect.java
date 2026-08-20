package com.lingxi.starter.security.permission;

import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.util.StringUtils;

import java.lang.reflect.Method;

@Aspect
public class PermissionAspect {

    private final PermissionDecisionClient permissionDecisionClient;

    public PermissionAspect(PermissionDecisionClient permissionDecisionClient) {
        this.permissionDecisionClient = permissionDecisionClient;
    }

    @Before("@within(com.lingxi.starter.security.annotation.RequirePermission) || @annotation(com.lingxi.starter.security.annotation.RequirePermission)")
    public void checkPermission(JoinPoint joinPoint) {
        RequirePermission annotation = resolveAnnotation(joinPoint);
        if (annotation == null || annotation.value().length == 0) {
            return;
        }
        UserContext.UserPrincipal principal = UserContext.get()
                .orElseThrow(() -> new BizException(ErrorCode.UNAUTHORIZED));
        for (String perm : annotation.value()) {
            if (!StringUtils.hasText(perm)) {
                continue;
            }
            boolean allowed = permissionDecisionClient.enforce(
                    principal.getUserId(), principal.getTenantId(), perm.trim());
            if (!allowed) {
                // 角色作为 subject 再试一次（Casbin g 分组后也可直接用用户 ID）
                for (String role : principal.getRoles()) {
                    if (permissionDecisionClient.enforce(role, principal.getTenantId(), perm.trim())) {
                        allowed = true;
                        break;
                    }
                }
            }
            if (!allowed) {
                throw new BizException(ErrorCode.FORBIDDEN, "permission denied: " + perm);
            }
        }
    }

    private RequirePermission resolveAnnotation(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        RequirePermission onMethod = AnnotationUtils.findAnnotation(method, RequirePermission.class);
        if (onMethod != null) {
            return onMethod;
        }
        return AnnotationUtils.findAnnotation(signature.getDeclaringType(), RequirePermission.class);
    }
}
