package com.lingxi.opensite.infra;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingxi.opensite.domain.SiteErrorCodes;
import com.lingxi.starter.core.exception.BizException;
import org.springframework.stereotype.Component;
import org.springframework.util.DigestUtils;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * P0：进程内幂等表（后续换 Redis）。
 */
@Component
public class IdempotencyStore {

    private final ObjectMapper objectMapper;
    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public IdempotencyStore(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public <T> T beginOrReplay(String scope, String idempotencyKey, Object requestBody, Class<T> responseType,
                               ResponseSupplier<T> supplier) {
        if (!StringUtils.hasText(idempotencyKey)) {
            throw new BizException("010004", "X-Idempotency-Key is required");
        }
        String key = scope + ":" + idempotencyKey.trim();
        String requestHash = hash(requestBody);
        Entry existing = store.get(key);
        if (existing != null) {
            if (!existing.requestHash.equals(requestHash)) {
                throw new BizException(SiteErrorCodes.ORDER_IDEMPOTENCY_CONFLICT,
                        "idempotency key reused with different payload");
            }
            return objectMapper.convertValue(existing.response, responseType);
        }

        T response = supplier.get();
        Entry previous = store.putIfAbsent(key, new Entry(requestHash, response));
        if (previous != null) {
            if (!previous.requestHash.equals(requestHash)) {
                throw new BizException(SiteErrorCodes.ORDER_IDEMPOTENCY_CONFLICT,
                        "idempotency key reused with different payload");
            }
            return objectMapper.convertValue(previous.response, responseType);
        }
        return response;
    }

    private String hash(Object body) {
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(body == null ? Map.of() : body);
            return DigestUtils.md5DigestAsHex(bytes);
        } catch (JsonProcessingException ex) {
            return DigestUtils.md5DigestAsHex(String.valueOf(body).getBytes(StandardCharsets.UTF_8));
        }
    }

    @FunctionalInterface
    public interface ResponseSupplier<T> {
        T get();
    }

    private record Entry(String requestHash, Object response) {
    }
}
