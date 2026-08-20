package com.lingxi.file.infra;

import com.lingxi.file.api.FileStorageService;
import com.lingxi.file.config.LingxiFileProperties;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 本地目录预签名骨架；mode=minio 时返回明确降级提示（不散落 SDK 凭证到业务）。
 */
@Service
public class LocalOrMinioFileStorageService implements FileStorageService {

    private final LingxiFileProperties properties;

    public LocalOrMinioFileStorageService(LingxiFileProperties properties) {
        this.properties = properties;
        if ("local".equalsIgnoreCase(properties.getMode())) {
            try {
                Files.createDirectories(Path.of(properties.getLocalBaseDir()));
            } catch (Exception ignored) {
                // startup soft-fail; upload will report
            }
        }
    }

    @Override
    public Map<String, Object> createUploadUrl(String objectKey, String contentType, long expireSeconds) {
        String key = (objectKey == null || objectKey.isBlank())
                ? ("upload/" + UUID.randomUUID())
                : objectKey.replace("..", "");
        long exp = expireSeconds > 0 ? expireSeconds : properties.getDefaultExpireSeconds();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("objectKey", key);
        data.put("contentType", contentType);
        data.put("expiresAt", Instant.now().plusSeconds(exp).toString());
        data.put("mode", properties.getMode());
        if ("minio".equalsIgnoreCase(properties.getMode())) {
            data.put("available", false);
            data.put("message", "MinIO adapter not wired in this build; set lingxi.file.mode=local or enable MinIO client later");
            data.put("uploadUrl", null);
        } else {
            data.put("available", true);
            data.put("method", "PUT");
            data.put("uploadUrl", properties.getPublicBaseUrl() + "/upload?key=" + key);
        }
        return data;
    }

    @Override
    public Map<String, Object> createDownloadUrl(String objectKey, long expireSeconds) {
        long exp = expireSeconds > 0 ? expireSeconds : properties.getDefaultExpireSeconds();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("objectKey", objectKey);
        data.put("expiresAt", Instant.now().plusSeconds(exp).toString());
        data.put("mode", properties.getMode());
        if ("minio".equalsIgnoreCase(properties.getMode())) {
            data.put("available", false);
            data.put("downloadUrl", null);
        } else {
            data.put("available", true);
            data.put("downloadUrl", properties.getPublicBaseUrl() + "/download?key=" + objectKey);
        }
        return data;
    }

    @Override
    public boolean isAvailable() {
        return !"minio".equalsIgnoreCase(properties.getMode());
    }
}
