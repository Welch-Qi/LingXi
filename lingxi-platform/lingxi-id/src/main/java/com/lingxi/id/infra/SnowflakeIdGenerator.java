package com.lingxi.id.infra;

import com.lingxi.id.api.IdGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 简化雪花：41bit 时间 + 10bit 节点 + 12bit 序列（适配单机/小集群）。
 */
@Component
public class SnowflakeIdGenerator implements IdGenerator {

    private static final long EPOCH = 1704067200000L; // 2024-01-01 UTC
    private static final long NODE_BITS = 10L;
    private static final long SEQ_BITS = 12L;
    private static final long MAX_SEQ = ~(-1L << SEQ_BITS);

    private final long nodeId;
    private final AtomicInteger bizSeq = new AtomicInteger();
    private long lastTs = -1L;
    private long sequence = 0L;

    public SnowflakeIdGenerator(@Value("${lingxi.id.worker-id:1}") long workerId) {
        long maxNode = ~(-1L << NODE_BITS);
        if (workerId < 0 || workerId > maxNode) {
            throw new IllegalArgumentException("lingxi.id.worker-id out of range: " + workerId);
        }
        this.nodeId = workerId;
    }

    @Override
    public synchronized long nextId() {
        long ts = System.currentTimeMillis();
        if (ts < lastTs) {
            // 时钟回拨：等待追上
            ts = waitUntil(lastTs);
        }
        if (ts == lastTs) {
            sequence = (sequence + 1) & MAX_SEQ;
            if (sequence == 0L) {
                ts = waitUntil(lastTs + 1);
            }
        } else {
            sequence = 0L;
        }
        lastTs = ts;
        return ((ts - EPOCH) << (NODE_BITS + SEQ_BITS))
                | (nodeId << SEQ_BITS)
                | sequence;
    }

    @Override
    public String nextBizCode(String prefix) {
        String p = (prefix == null || prefix.isBlank()) ? "ID" : prefix.trim().toUpperCase();
        String day = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE).substring(2); // yyMMdd
        int n = Math.floorMod(bizSeq.incrementAndGet(), 1_000_000);
        return p + "-" + day + "-" + String.format("%06d", n);
    }

    private static long waitUntil(long target) {
        long ts = System.currentTimeMillis();
        while (ts < target) {
            ts = System.currentTimeMillis();
        }
        return ts;
    }
}
