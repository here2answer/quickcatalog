package com.quickcatalog.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ai")
public class AiConfig {
    private String ollamaUrl = "http://localhost:11434";
    private String ollamaModel = "llama3.1";
    private String openaiUrl = "https://api.openai.com/v1";
    private String openaiModel = "gpt-4o-mini";
    private int timeoutSeconds = 30;
}
