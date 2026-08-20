package com.lingxi.starter.core.security;

/**
 * 数据权限范围（与规约枚举一致）。
 */
public enum DataScope {
    SELF,
    DEPT,
    DEPT_AND_SUB,
    CUSTOM,
    ALL
}
