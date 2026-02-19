package com.quickcatalog.channel.entity;

import com.quickcatalog.channel.entity.enums.ChannelType;
import com.quickcatalog.channel.entity.enums.SyncFrequency;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "channel")
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "channel_type", columnDefinition = "channel_type")
    private ChannelType channelType;

    @Column(name = "channel_name")
    private String channelName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "credentials", columnDefinition = "jsonb")
    private String credentials;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "field_mapping", columnDefinition = "jsonb")
    private String fieldMapping;

    @Column(name = "is_active")
    private boolean active = true;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "sync_frequency", columnDefinition = "sync_frequency")
    private SyncFrequency syncFrequency = SyncFrequency.MANUAL;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
