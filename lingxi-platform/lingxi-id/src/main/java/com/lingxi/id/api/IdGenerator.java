package com.lingxi.id.api;

/**
 * 分布式 ID（雪花）与业务编码生成。
 */
public interface IdGenerator {

    /** 雪花 BIGINT 主键 */
    long nextId();

    /**
     * 业务编码：前缀 + 时间片段 + 序号，如 LEAD-260817-000123。
     */
    String nextBizCode(String prefix);
}
