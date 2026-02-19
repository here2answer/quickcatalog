package com.quickcatalog.service;

import com.quickcatalog.entity.ActivityLog;
import com.quickcatalog.entity.enums.ActionType;
import com.quickcatalog.entity.enums.EntityType;
import com.quickcatalog.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public void log(UUID tenantId, UUID userId, EntityType entityType, UUID entityId, ActionType action, String details) {
        ActivityLog activityLog = new ActivityLog();
        activityLog.setTenantId(tenantId);
        activityLog.setUserId(userId);
        activityLog.setEntityType(entityType);
        activityLog.setEntityId(entityId);
        activityLog.setAction(action);
        activityLog.setDetails(details);
        activityLogRepository.save(activityLog);
        log.debug("Activity logged: {} {} on {} {}", action, entityType, entityId, details);
    }
}
