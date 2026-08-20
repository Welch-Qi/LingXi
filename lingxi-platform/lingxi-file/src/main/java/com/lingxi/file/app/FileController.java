package com.lingxi.file.app;

import com.lingxi.file.api.FileStorageService;
import com.lingxi.file.config.LingxiFileProperties;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.security.annotation.RequirePermission;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final LingxiFileProperties properties;

    public FileController(FileStorageService fileStorageService, LingxiFileProperties properties) {
        this.fileStorageService = fileStorageService;
        this.properties = properties;
    }

    @PostMapping("/presign-upload")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> presignUpload(@RequestBody Map<String, Object> body) {
        String key = body.get("objectKey") == null ? null : String.valueOf(body.get("objectKey"));
        String ct = body.get("contentType") == null ? "application/octet-stream" : String.valueOf(body.get("contentType"));
        long exp = body.get("expireSeconds") instanceof Number n ? n.longValue() : 0L;
        return Result.ok(fileStorageService.createUploadUrl(key, ct, exp));
    }

    @PostMapping("/presign-download")
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, Object>> presignDownload(@RequestBody Map<String, Object> body) {
        String key = body.get("objectKey") == null ? null : String.valueOf(body.get("objectKey"));
        if (!StringUtils.hasText(key)) {
            throw new BizException(ErrorCode.BAD_REQUEST);
        }
        long exp = body.get("expireSeconds") instanceof Number n ? n.longValue() : 0L;
        return Result.ok(fileStorageService.createDownloadUrl(key, exp));
    }

    @GetMapping("/health")
    public Result<Map<String, Object>> health() {
        return Result.ok(Map.of(
                "available", fileStorageService.isAvailable(),
                "mode", properties.getMode()
        ));
    }

    /** 本地模式实际上传（演示）；生产应走对象存储预签名直传。 */
    @PutMapping(value = "/upload", consumes = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @RequirePermission("dc:customer:manage")
    public Result<Map<String, String>> upload(@RequestParam String key, @RequestBody byte[] body) throws IOException {
        if (!"local".equalsIgnoreCase(properties.getMode())) {
            throw new BizException(ErrorCode.BIZ_ERROR.getCode(), "local upload only when lingxi.file.mode=local");
        }
        Path target = Path.of(properties.getLocalBaseDir(), key.replace("..", ""));
        Files.createDirectories(target.getParent());
        Files.write(target, body == null ? new byte[0] : body);
        return Result.ok(Map.of("objectKey", key, "stored", "true"));
    }
}
