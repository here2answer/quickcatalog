package com.quickcatalog.channel.connector;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PublishResult {

    private boolean success;
    private String message;
    private String externalListingId;
    private String externalUrl;

    public static PublishResult success(String message, String externalListingId, String externalUrl) {
        return new PublishResult(true, message, externalListingId, externalUrl);
    }

    public static PublishResult failure(String message) {
        return new PublishResult(false, message, null, null);
    }

    public String getErrorMessage() {
        return success ? null : message;
    }
}
