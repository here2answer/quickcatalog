package com.quickcatalog.controller;

import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.importjob.ImportErrorResponse;
import com.quickcatalog.dto.importjob.ImportJobResponse;
import com.quickcatalog.dto.importjob.ImportJobStatusResponse;
import com.quickcatalog.service.BulkImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class BulkImportController {

    private final BulkImportService bulkImportService;

    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ImportJobResponse> upload(@RequestParam("file") MultipartFile file) throws IOException {
        ImportJobResponse response = bulkImportService.uploadFile(file);
        return ApiResponse.success(response);
    }

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] template = bulkImportService.generateTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "import-template.csv");
        headers.setContentLength(template.length);
        return new ResponseEntity<>(template, headers, HttpStatus.OK);
    }

    @GetMapping("/{jobId}/status")
    public ApiResponse<ImportJobStatusResponse> getStatus(@PathVariable UUID jobId) {
        ImportJobStatusResponse response = bulkImportService.getJobStatus(jobId);
        return ApiResponse.success(response);
    }

    @GetMapping("/{jobId}/errors")
    public ApiResponse<List<ImportErrorResponse>> getErrors(@PathVariable UUID jobId) {
        List<ImportErrorResponse> response = bulkImportService.getJobErrors(jobId);
        return ApiResponse.success(response);
    }
}
