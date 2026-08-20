package com.lingxi.starter.core.exception;

import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.trace.TraceIdFilter;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result<Void> handleBiz(BizException ex) {
        Result<Void> result = Result.fail(ex.getCode(), ex.getMessage());
        result.setTraceId(MDC.get(TraceIdFilter.MDC_KEY));
        return result;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result<Void> handleValidation(MethodArgumentNotValidException ex) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String message = fieldError == null ? "validation failed" : fieldError.getField() + " " + fieldError.getDefaultMessage();
        Result<Void> result = Result.fail("010004", message);
        result.setTraceId(MDC.get(TraceIdFilter.MDC_KEY));
        return result;
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleOther(Exception ex) {
        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class)
                .error("unhandled exception", ex);
        Result<Void> result = Result.fail(ErrorCode.INTERNAL_ERROR);
        result.setTraceId(MDC.get(TraceIdFilter.MDC_KEY));
        return result;
    }
}
