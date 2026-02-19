package com.quickcatalog.channel.dto;

import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.channel.entity.enums.SyncFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChannelRequest {

    @NotNull
    private ChannelType channelType;

    @NotBlank
    private String channelName;

    private String credentials;

    private String fieldMapping;

    private Boolean active = true;

    private SyncFrequency syncFrequency = SyncFrequency.MANUAL;
}
