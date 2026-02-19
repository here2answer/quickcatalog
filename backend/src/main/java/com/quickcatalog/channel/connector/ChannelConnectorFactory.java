package com.quickcatalog.channel.connector;

import com.quickcatalog.channel.entity.enums.ChannelType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChannelConnectorFactory {

    private final List<ChannelConnector> connectors;

    public ChannelConnector getConnector(ChannelType channelType) {
        return connectors.stream()
                .filter(c -> c.getChannelType() == channelType)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No connector for channel type: " + channelType));
    }
}
