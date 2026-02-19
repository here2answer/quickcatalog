package com.quickcatalog.controller;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.common.PagedResponse;
import com.quickcatalog.dto.dashboard.RecentActivityResponse;
import com.quickcatalog.entity.ActivityLog;
import com.quickcatalog.entity.enums.ActionType;
import com.quickcatalog.entity.enums.EntityType;
import com.quickcatalog.repository.ActivityLogRepository;
import com.quickcatalog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activity-log")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PagedResponse<ActivityLogResponse>> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId = TenantContext.getTenantId();
        Pageable pageable = PageRequest.of(page, size);

        EntityType et = null;
        ActionType at = null;

        if (entityType != null && !entityType.isBlank()) {
            try { et = EntityType.valueOf(entityType); } catch (IllegalArgumentException ignored) {}
        }
        if (action != null && !action.isBlank()) {
            try { at = ActionType.valueOf(action); } catch (IllegalArgumentException ignored) {}
        }

        Page<ActivityLog> logPage;
        if (et != null && at != null) {
            logPage = activityLogRepository.findByTenantIdAndEntityTypeAndActionOrderByCreatedAtDesc(tenantId, et, at, pageable);
        } else if (et != null) {
            logPage = activityLogRepository.findByTenantIdAndEntityTypeOrderByCreatedAtDesc(tenantId, et, pageable);
        } else if (at != null) {
            logPage = activityLogRepository.findByTenantIdAndActionOrderByCreatedAtDesc(tenantId, at, pageable);
        } else {
            logPage = activityLogRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable);
        }

        List<ActivityLogResponse> content = logPage.getContent().stream()
                .map(log -> {
                    String userName = null;
                    if (log.getUserId() != null) {
                        userName = userRepository.findById(log.getUserId())
                                .map(u -> u.getName())
                                .orElse(null);
                    }
                    return ActivityLogResponse.builder()
                            .id(log.getId())
                            .entityType(log.getEntityType() != null ? log.getEntityType().name() : null)
                            .entityId(log.getEntityId())
                            .action(log.getAction() != null ? log.getAction().name() : null)
                            .details(log.getDetails())
                            .userName(userName)
                            .createdAt(log.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        PagedResponse<ActivityLogResponse> response = PagedResponse.of(
                content, page, size, logPage.getTotalElements(), logPage.getTotalPages());
        return ApiResponse.success(response);
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ActivityLogResponse {
        private UUID id;
        private String entityType;
        private UUID entityId;
        private String action;
        private String details;
        private String userName;
        private java.time.LocalDateTime createdAt;
    }
}
