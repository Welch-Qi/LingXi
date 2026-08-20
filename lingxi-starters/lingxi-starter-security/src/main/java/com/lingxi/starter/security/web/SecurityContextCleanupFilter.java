package com.lingxi.starter.security.web;

import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.core.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 清理鉴权上下文，避免线程复用泄漏。
 */
public class SecurityContextCleanupFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
            TenantContext.clear();
        }
    }
}
