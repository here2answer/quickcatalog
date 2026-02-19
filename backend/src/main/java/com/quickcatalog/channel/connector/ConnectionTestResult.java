package com.quickcatalog.channel.connector;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConnectionTestResult {

    private boolean success;
    private String message;

    public static ConnectionTestResult success(String message) {
        return new ConnectionTestResult(true, message);
    }

    public static ConnectionTestResult failure(String message) {
        return new ConnectionTestResult(false, message);
    }
}
