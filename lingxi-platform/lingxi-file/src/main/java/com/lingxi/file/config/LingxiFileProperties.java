package com.lingxi.file.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "lingxi.file")
public class LingxiFileProperties {

    /** local | minio */
    private String mode = "local";
    private String localBaseDir = "./data/files";
    private String publicBaseUrl = "http://127.0.0.1:8080/api/v1/files";
    private String minioEndpoint = "http://127.0.0.1:9000";
    private String minioAccessKey = "minioadmin";
    private String minioSecretKey = "minioadmin";
    private String minioBucket = "lingxi-media";
    private long defaultExpireSeconds = 900;

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getLocalBaseDir() {
        return localBaseDir;
    }

    public void setLocalBaseDir(String localBaseDir) {
        this.localBaseDir = localBaseDir;
    }

    public String getPublicBaseUrl() {
        return publicBaseUrl;
    }

    public void setPublicBaseUrl(String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
    }

    public String getMinioEndpoint() {
        return minioEndpoint;
    }

    public void setMinioEndpoint(String minioEndpoint) {
        this.minioEndpoint = minioEndpoint;
    }

    public String getMinioAccessKey() {
        return minioAccessKey;
    }

    public void setMinioAccessKey(String minioAccessKey) {
        this.minioAccessKey = minioAccessKey;
    }

    public String getMinioSecretKey() {
        return minioSecretKey;
    }

    public void setMinioSecretKey(String minioSecretKey) {
        this.minioSecretKey = minioSecretKey;
    }

    public String getMinioBucket() {
        return minioBucket;
    }

    public void setMinioBucket(String minioBucket) {
        this.minioBucket = minioBucket;
    }

    public long getDefaultExpireSeconds() {
        return defaultExpireSeconds;
    }

    public void setDefaultExpireSeconds(long defaultExpireSeconds) {
        this.defaultExpireSeconds = defaultExpireSeconds;
    }
}
