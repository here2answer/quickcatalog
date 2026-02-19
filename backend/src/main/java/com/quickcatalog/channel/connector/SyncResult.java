package com.quickcatalog.channel.connector;

import com.quickcatalog.channel.entity.enums.ListingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SyncResult {

    private ListingStatus status;
    private String error;

    public static SyncResult success(ListingStatus status) {
        return new SyncResult(status, null);
    }

    public static SyncResult error(String error) {
        return new SyncResult(ListingStatus.ERROR, error);
    }
}
