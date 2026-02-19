package com.quickcatalog.config;

import java.util.UUID;

public class TenantContext {

    private static final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();
    private static final ThreadLocal<UUID> currentUserId = new ThreadLocal<>();

    public static UUID getTenantId() {
        return currentTenant.get();
    }

    public static void setTenantId(UUID tenantId) {
        currentTenant.set(tenantId);
    }

    public static UUID getUserId() {
        return currentUserId.get();
    }

    public static void setUserId(UUID userId) {
        currentUserId.set(userId);
    }

    public static void clear() {
        currentTenant.remove();
        currentUserId.remove();
    }
}
