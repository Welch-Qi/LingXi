package com.lingxi.file.api;

import java.util.Map;

/**
 * 文件服务：预签名上传/下载（凭证不出业务模块）。
 */
public interface FileStorageService {

    Map<String, Object> createUploadUrl(String objectKey, String contentType, long expireSeconds);

    Map<String, Object> createDownloadUrl(String objectKey, long expireSeconds);

    boolean isAvailable();
}
