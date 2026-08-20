package com.lingxi.starter.core.result;

/**
 * 通用错误码。
 */
public enum ErrorCode {
    SUCCESS("0", "success"),
    BAD_REQUEST("400", "bad request"),
    UNAUTHORIZED("401", "unauthorized"),
    FORBIDDEN("403", "forbidden"),
    NOT_FOUND("404", "not found"),
    INTERNAL_ERROR("500", "internal error"),
    BIZ_ERROR("BIZ_ERROR", "business error");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}