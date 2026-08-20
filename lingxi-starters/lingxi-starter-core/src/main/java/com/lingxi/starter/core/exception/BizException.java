package com.lingxi.starter.core.exception;

import com.lingxi.starter.core.result.ErrorCode;

/**
 * 业务异常。
 */
public class BizException extends RuntimeException {

    private final String code;

    public BizException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.code = errorCode.getCode();
    }

    public BizException(String code, String message) {
        super(message);
        this.code = code;
    }

    public BizException(ErrorCode errorCode, String message) {
        super(message);
        this.code = errorCode.getCode();
    }

    public String getCode() {
        return code;
    }
}