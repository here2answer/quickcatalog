package com.quickcatalog.dto.dashboard;

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
public class RecentActivityResponse {
    private UUID id;
    private String entityType;
    private UUID entityId;
    private String action;
    private String details;
    private LocalDateTime createdAt;
}
