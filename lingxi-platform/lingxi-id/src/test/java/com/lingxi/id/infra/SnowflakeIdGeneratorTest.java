package com.lingxi.id.infra;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SnowflakeIdGeneratorTest {

    @Test
    void nextId_isUniqueAndPositive() {
        SnowflakeIdGenerator gen = new SnowflakeIdGenerator(1);
        Set<Long> ids = new HashSet<>();
        for (int i = 0; i < 5000; i++) {
            long id = gen.nextId();
            assertTrue(id > 0);
            assertTrue(ids.add(id), "duplicate id " + id);
        }
    }

    @Test
    void nextBizCode_hasPrefix() {
        SnowflakeIdGenerator gen = new SnowflakeIdGenerator(1);
        String code = gen.nextBizCode("LEAD");
        assertTrue(code.startsWith("LEAD-"));
        assertEquals(3, code.split("-").length);
    }
}
