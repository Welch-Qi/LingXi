package com.lingxi.starter.security.permission;

import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.security.DataScope;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PermissionAspectTest {

    @Mock
    private PermissionDecisionClient permissionDecisionClient;

    @Mock
    private JoinPoint joinPoint;

    @Mock
    private MethodSignature methodSignature;

    private PermissionAspect aspect;

    @BeforeEach
    void setUp() {
        aspect = new PermissionAspect(permissionDecisionClient);
        UserContext.set(new UserContext.UserPrincipal(
                "10086001", "admin", "Admin", 10086L, List.of("role_admin"), DataScope.ALL, "10086001"));
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
        TenantContext.clear();
    }

    @Test
    void allowsWhenPermissionGranted() throws Exception {
        Method method = SecuredMethods.class.getDeclaredMethod("secured");
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(permissionDecisionClient.enforce("10086001", 10086L, "sal:lead:view")).thenReturn(true);

        assertThatCode(() -> aspect.checkPermission(joinPoint)).doesNotThrowAnyException();
    }

    @Test
    void throwsWhenPermissionDenied() throws Exception {
        Method method = SecuredMethods.class.getDeclaredMethod("secured");
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(permissionDecisionClient.enforce("10086001", 10086L, "sal:lead:view")).thenReturn(false);
        when(permissionDecisionClient.enforce("role_admin", 10086L, "sal:lead:view")).thenReturn(false);

        assertThatThrownBy(() -> aspect.checkPermission(joinPoint))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("permission denied");
    }

    private static final class SecuredMethods {
        @RequirePermission("sal:lead:view")
        void secured() {
        }
    }
}
