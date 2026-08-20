package com.lingxi.file.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@AutoConfiguration
@Configuration
@EnableConfigurationProperties(LingxiFileProperties.class)
public class FileAutoConfiguration {
}
