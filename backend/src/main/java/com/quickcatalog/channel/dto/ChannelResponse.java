package com.quickcatalog.channel.dto;

import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.channel.entity.enums.SyncFrequency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelResponse {

    private UUID id;
    private ChannelType channelType;
    private String channelName;
    private String credentials;
    private String fieldMapping;
    private boolean active;
    private SyncFrequency syncFrequency;
    private LocalDateTime lastSyncedAt;
    private long liveListings;
    private long pendingListings;
    private long errorListings;
    private LocalDateTime createdAt;
}
