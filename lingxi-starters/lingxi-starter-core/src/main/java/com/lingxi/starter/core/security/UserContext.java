package com.lingxi.starter.core.security;

import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * 当前登录用户上下文（ThreadLocal），由 starter-security 在鉴权后写入。
 */
public final class UserContext {

    private static final ThreadLocal<UserPrincipal> HOLDER = new ThreadLocal<>();

    private UserContext() {
    }

    public static void set(UserPrincipal principal) {
        HOLDER.set(principal);
    }

    public static Optional<UserPrincipal> get() {
        return Optional.ofNullable(HOLDER.get());
    }

    public static UserPrincipal require() {
        UserPrincipal principal = HOLDER.get();
        if (principal == null) {
            throw new BizException(ErrorCode.UNAUTHORIZED);
        }
        return principal;
    }

    public static void clear() {
        HOLDER.remove();
    }

    /**
     * 登录用户主体。
     */
    public static final class UserPrincipal {
        private final String userId;
        private final String username;
        private final String displayName;
        private final Long tenantId;
        private final List<String> roles;
        private final DataScope dataScope;
        private final String tokenSubject;

        public UserPrincipal(String userId, String username, String displayName, Long tenantId,
                             List<String> roles, DataScope dataScope, String tokenSubject) {
            this.userId = userId;
            this.username = username;
            this.displayName = displayName;
            this.tenantId = tenantId;
            this.roles = roles == null ? List.of() : List.copyOf(roles);
            this.dataScope = dataScope == null ? DataScope.SELF : dataScope;
            this.tokenSubject = tokenSubject;
        }

        public String getUserId() {
            return userId;
        }

        public String getUsername() {
            return username;
        }

        public String getDisplayName() {
            return displayName;
        }

        public Long getTenantId() {
            return tenantId;
        }

        public List<String> getRoles() {
            return Collections.unmodifiableList(roles);
        }

        public DataScope getDataScope() {
            return dataScope;
        }

        public String getTokenSubject() {
            return tokenSubject;
        }
    }
}
