package com.lingxi.opensite.domain;

/**
 * 触点站点 ThreadLocal 上下文。
 */
public final class SiteContext {

    private static final ThreadLocal<SiteBinding> HOLDER = new ThreadLocal<>();

    private SiteContext() {
    }

    public static void set(SiteBinding binding) {
        HOLDER.set(binding);
    }

    public static SiteBinding get() {
        return HOLDER.get();
    }

    public static SiteBinding require() {
        SiteBinding binding = HOLDER.get();
        if (binding == null) {
            throw new IllegalStateException("SiteContext is empty");
        }
        return binding;
    }

    public static void clear() {
        HOLDER.remove();
    }
}
