package com.quickcatalog.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelStatusResponse {
    private UUID channelId;
    private String channelName;
    private String channelType;
    private long liveCount;
    private long pendingCount;
    private long errorCount;
    private long totalListings;
}
