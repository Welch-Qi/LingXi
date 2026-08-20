package com.lingxi.starter.security.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标记接口需要数据权限上下文（由 IAM 解析后写入 UserPrincipal.dataScope）。
 * 具体行级过滤由仓储层读取 UserContext 执行。
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireDataScope {
}
