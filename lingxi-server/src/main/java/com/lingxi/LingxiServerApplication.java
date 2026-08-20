package com.lingxi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 灵犀一期模块化单体启动入口。
 */
@SpringBootApplication(scanBasePackages = "com.lingxi")
public class LingxiServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(LingxiServerApplication.class, args);
    }
}