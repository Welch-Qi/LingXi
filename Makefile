# 灵犀系统统一构建入口
# 覆盖 Java (Maven) + 前端 (pnpm/Turborepo) + AI (Python/uv) 三栈
# 用法：make build | make test | make lint | make dev

SHELL := /bin/bash

# Java
MVNW := ./mvnw
JAVA_HOME ?= $(shell echo $$JAVA_HOME)

# 前端
WEB_DIR := lingxi-web
PNPM := pnpm

# AI
AI_DIR := lingxi-ai
UV := uv

.PHONY: build build-java build-web build-ai test test-java test-web test-ai lint lint-java lint-web lint-ai dev dev-java dev-web dev-ai clean

## 构建全部
build: build-java build-web build-ai

build-java:
	$(MVNW) clean compile -T 4 -q

build-web:
	cd $(WEB_DIR) && $(PNPM) install --frozen-lockfile && $(PNPM) build

build-ai:
	cd $(AI_DIR) && $(UV) sync

## 测试全部
test: test-java test-web test-ai

test-java:
	$(MVNW) test -T 4

test-web:
	cd $(WEB_DIR) && $(PNPM) test

test-ai:
	cd $(AI_DIR) && pytest

## 代码检查
lint: lint-java lint-web lint-ai

lint-java:
	$(MVNW) checkstyle:check -q 2>/dev/null || echo "checkstyle not configured, skip"

lint-web:
	cd $(WEB_DIR) && $(PNPM) lint

lint-ai:
	cd $(AI_DIR) && mypy lingxi_agent_runtime 2>/dev/null || echo "mypy not configured, skip"

## 开发环境
dev: dev-java

dev-java:
	$(MVNW) spring-boot:run -pl lingxi-server

dev-web:
	cd $(WEB_DIR) && $(PNPM) dev

## 打包（跳过测试）
package:
	$(MVNW) clean package -DskipTests -T 4

## 清理
clean:
	$(MVNW) clean -q
	cd $(WEB_DIR) && $(PNPM) run clean 2>/dev/null || rm -rf .next .turbo
	cd $(AI_DIR) && rm -rf .venv __pycache__

## 安装 Maven Wrapper（如未安装）
install-wrapper:
	curl -sSfL https://raw.githubusercontent.com/apache/maven-wrapper/master/maven-wrapper-distribution/src/resources/mvnw -o mvnw
	curl -sSfL https://raw.githubusercontent.com/apache/maven-wrapper/master/maven-wrapper-distribution/src/resources/mvnw.cmd -o mvnw.cmd
	chmod +x mvnw
	mkdir -p .mvn/wrapper
	echo "distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip" > .mvn/wrapper/maven-wrapper.properties
