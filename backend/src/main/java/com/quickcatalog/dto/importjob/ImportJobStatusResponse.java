package com.quickcatalog.dto.importjob;

import com.quickcatalog.entity.enums.ImportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportJobStatusResponse {
    private UUID id;
    private String fileName;
    private int totalRows;
    private int processedRows;
    private int successCount;
    private int errorCount;
    private ImportStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ImportErrorResponse> errors;
}
