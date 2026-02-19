package com.quickcatalog.ondc.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Data
@Configuration
@ConfigurationProperties(prefix = "ondc")
public class OndcProperties {

    private boolean enabled = true;
    private String environment = "STAGING";
    private Map<String, RegistryConfig> registry;
    private CallbackConfig callback = new CallbackConfig();

    @Data
    public static class RegistryConfig {
        private String subscribeUrl;
        private String lookupUrl;
        private String encryptionPublicKey;
    }

    @Data
    public static class CallbackConfig {
        private int timeoutSeconds = 30;
    }

    public RegistryConfig getActiveRegistry() {
        String envKey = switch (environment.toUpperCase()) {
            case "PRE_PROD" -> "pre-prod";
            case "PRODUCTION" -> "production";
            default -> "staging";
        };
        return registry.get(envKey);
    }
}
