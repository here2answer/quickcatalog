package com.quickcatalog.ondc.beckn.service;

import com.quickcatalog.ondc.entity.OndcApiLog;
import com.quickcatalog.ondc.entity.enums.ApiDirection;
import com.quickcatalog.ondc.repository.OndcApiLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OndcApiLogService {

    private final OndcApiLogRepository repository;

    @Async("ondcCallbackExecutor")
    public void logIncoming(UUID tenantId, String action, String transactionId,
                            String messageId, String bapId, String requestBody,
                            int httpStatus, String errorMessage) {
        try {
            OndcApiLog apiLog = new OndcApiLog();
            apiLog.setTenantId(tenantId);
            apiLog.setDirection(ApiDirection.INCOMING);
            apiLog.setAction(action);
            apiLog.setTransactionId(transactionId);
            apiLog.setMessageId(messageId);
            apiLog.setBapId(bapId);
            apiLog.setRequestBody(requestBody);
            apiLog.setHttpStatus(httpStatus);
            apiLog.setErrorMessage(errorMessage);
            repository.save(apiLog);
        } catch (Exception e) {
            log.error("Failed to log ONDC incoming API call: {}", e.getMessage());
        }
    }

    @Async("ondcCallbackExecutor")
    public void logOutgoing(UUID tenantId, String action, String transactionId,
                            String messageId, String requestBody, String responseBody,
                            int httpStatus, String errorMessage, long processingTimeMs) {
        try {
            OndcApiLog apiLog = new OndcApiLog();
            apiLog.setTenantId(tenantId);
            apiLog.setDirection(ApiDirection.OUTGOING);
            apiLog.setAction(action);
            apiLog.setTransactionId(transactionId);
            apiLog.setMessageId(messageId);
            apiLog.setRequestBody(requestBody);
            apiLog.setResponseBody(responseBody);
            apiLog.setHttpStatus(httpStatus);
            apiLog.setErrorMessage(errorMessage);
            apiLog.setProcessingTimeMs((int) processingTimeMs);
            repository.save(apiLog);
        } catch (Exception e) {
            log.error("Failed to log ONDC outgoing API call: {}", e.getMessage());
        }
    }

    public Page<OndcApiLog> getLogs(UUID tenantId, String action, int page, int size) {
        if (action != null && !action.isEmpty()) {
            return repository.findByTenantIdAndActionOrderByCreatedAtDesc(
                    tenantId, action, PageRequest.of(page, size));
        }
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(page, size));
    }
}
