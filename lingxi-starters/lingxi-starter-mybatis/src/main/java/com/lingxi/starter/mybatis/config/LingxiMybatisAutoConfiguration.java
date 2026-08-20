package com.lingxi.starter.mybatis.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import org.apache.ibatis.reflection.MetaObject;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;

import java.time.Instant;

/**
 * MyBatis-Plus：Mapper 扫描、分页、审计字段与租户填充。
 */
@AutoConfiguration
@MapperScan("com.lingxi.**.infra.mapper")
public class LingxiMybatisAutoConfiguration {

    @Bean
    public LingxiMybatisMarker lingxiMybatisMarker() {
        return new LingxiMybatisMarker();
    }

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.POSTGRE_SQL));
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        return interceptor;
    }

    @Bean
    public MetaObjectHandler lingxiMetaObjectHandler() {
        return new MetaObjectHandler() {
            @Override
            public void insertFill(MetaObject metaObject) {
                Instant now = Instant.now();
                strictInsertFill(metaObject, "createdAt", Instant.class, now);
                strictInsertFill(metaObject, "updatedAt", Instant.class, now);
                Long userId = currentUserId();
                if (userId != null) {
                    strictInsertFill(metaObject, "createdBy", Long.class, userId);
                    strictInsertFill(metaObject, "updatedBy", Long.class, userId);
                }
                Long tenantId = TenantContext.getTenantId();
                if (tenantId != null) {
                    strictInsertFill(metaObject, "tenantId", Long.class, tenantId);
                }
            }

            @Override
            public void updateFill(MetaObject metaObject) {
                strictUpdateFill(metaObject, "updatedAt", Instant.class, Instant.now());
                Long userId = currentUserId();
                if (userId != null) {
                    strictUpdateFill(metaObject, "updatedBy", Long.class, userId);
                }
            }

            private Long currentUserId() {
                return UserContext.get()
                        .map(UserContext.UserPrincipal::getUserId)
                        .map(id -> {
                            try {
                                return Long.parseLong(id);
                            } catch (NumberFormatException ex) {
                                return null;
                            }
                        })
                        .orElse(null);
            }
        };
    }

    public static final class LingxiMybatisMarker {
    }
}
