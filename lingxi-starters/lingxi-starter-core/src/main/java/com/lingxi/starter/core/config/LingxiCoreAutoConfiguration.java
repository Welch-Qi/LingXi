package com.lingxi.starter.core.config;

import com.lingxi.starter.core.exception.GlobalExceptionHandler;
import com.lingxi.starter.core.result.ResultTraceIdAdvice;
import com.lingxi.starter.core.trace.TraceIdFilter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Import;

@AutoConfiguration
@Import({TraceIdFilter.class, GlobalExceptionHandler.class, ResultTraceIdAdvice.class})
public class LingxiCoreAutoConfiguration {
}