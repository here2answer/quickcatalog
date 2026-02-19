package com.quickcatalog.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.importjob.ImportErrorResponse;
import com.quickcatalog.dto.importjob.ImportJobResponse;
import com.quickcatalog.dto.importjob.ImportJobStatusResponse;
import com.quickcatalog.entity.BulkImportJob;
import com.quickcatalog.entity.Category;
import com.quickcatalog.entity.Product;
import com.quickcatalog.entity.enums.*;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.repository.BulkImportJobRepository;
import com.quickcatalog.repository.CategoryRepository;
import com.quickcatalog.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class BulkImportService {

    private final BulkImportJobRepository importJobRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ActivityLogService activityLogService;
    private final ObjectMapper objectMapper;

    private static final String[] TEMPLATE_HEADERS = {
            "Name", "SKU", "Category", "Brand", "MRP", "SellingPrice",
            "CostPrice", "GSTRate", "HSNCode", "Unit", "Stock",
            "LowStockThreshold", "Tags", "Status"
    };

    public byte[] generateTemplate() {
        StringBuilder sb = new StringBuilder();
        sb.append(String.join(",", TEMPLATE_HEADERS)).append("\n");
        sb.append("\"Sample Product\",\"SKU-001\",\"Electronics\",\"BrandX\",999.00,799.00,500.00,GST_18,\"85171200\",\"PCS\",100,10,\"tag1|tag2\",\"DRAFT\"\n");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public ImportJobResponse uploadFile(MultipartFile file) throws IOException {
        UUID tenantId = TenantContext.getTenantId();
        UUID userId = TenantContext.getUserId();

        String fileName = file.getOriginalFilename();
        if (fileName == null) fileName = "import.csv";

        String ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        if (!ext.equals("csv") && !ext.equals("xlsx") && !ext.equals("xls")) {
            throw new IllegalArgumentException("Unsupported file type. Use CSV or Excel (.xlsx, .xls)");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File too large. Maximum 5MB allowed.");
        }

        BulkImportJob job = new BulkImportJob();
        job.setTenantId(tenantId);
        job.setFileName(fileName);
        job.setStatus(ImportStatus.UPLOADED);
        job.setCreatedBy(userId);
        job.setErrorLog("[]");
        job = importJobRepository.save(job);

        byte[] fileBytes = file.getBytes();
        processImport(job.getId(), fileBytes, fileName, tenantId, userId);

        return mapToResponse(importJobRepository.findById(job.getId()).orElse(job));
    }

    @Async("importExecutor")
    @Transactional
    public void processImport(UUID jobId, byte[] fileBytes, String fileName, UUID tenantId, UUID userId) {
        BulkImportJob job = importJobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        job.setStatus(ImportStatus.PROCESSING);
        job = importJobRepository.save(job);

        List<ImportErrorResponse> errors = new ArrayList<>();
        int successCount = 0;
        int errorCount = 0;

        try {
            String ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
            List<Map<String, String>> rows;

            if ("csv".equals(ext)) {
                rows = parseCsv(fileBytes);
            } else {
                rows = parseExcel(fileBytes);
            }

            job.setTotalRows(rows.size());
            job = importJobRepository.save(job);

            for (int i = 0; i < rows.size(); i++) {
                int rowNum = i + 2; // 1-based, skip header
                Map<String, String> row = rows.get(i);
                List<ImportErrorResponse> rowErrors = new ArrayList<>();

                try {
                    Product product = validateAndCreateProduct(row, rowNum, rowErrors, tenantId, userId);
                    if (product != null && rowErrors.isEmpty()) {
                        productRepository.save(product);
                        successCount++;
                    } else {
                        errorCount++;
                        errors.addAll(rowErrors);
                    }
                } catch (Exception e) {
                    errorCount++;
                    errors.add(ImportErrorResponse.builder()
                            .row(rowNum).field("general").error(e.getMessage()).build());
                }

                job.setProcessedRows(i + 1);
                job.setSuccessCount(successCount);
                job.setErrorCount(errorCount);
                importJobRepository.save(job);
            }

            job.setStatus(ImportStatus.COMPLETED);
        } catch (Exception e) {
            log.error("Import processing failed for job {}", jobId, e);
            job.setStatus(ImportStatus.FAILED);
            errors.add(ImportErrorResponse.builder()
                    .row(0).field("file").error("Processing failed: " + e.getMessage()).build());
        }

        try {
            job.setErrorLog(objectMapper.writeValueAsString(errors));
        } catch (JsonProcessingException e) {
            job.setErrorLog("[]");
        }
        importJobRepository.save(job);

        if (successCount > 0) {
            activityLogService.log(tenantId, userId, EntityType.PRODUCT, jobId,
                    ActionType.IMPORTED,
                    "{\"fileName\":\"" + fileName + "\",\"imported\":" + successCount + ",\"errors\":" + errorCount + "}");
        }
    }

    public ImportJobStatusResponse getJobStatus(UUID jobId) {
        UUID tenantId = TenantContext.getTenantId();
        BulkImportJob job = importJobRepository.findByIdAndTenantId(jobId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("ImportJob", "id", jobId));

        List<ImportErrorResponse> errors = parseErrors(job.getErrorLog());

        return ImportJobStatusResponse.builder()
                .id(job.getId())
                .fileName(job.getFileName())
                .totalRows(job.getTotalRows())
                .processedRows(job.getProcessedRows())
                .successCount(job.getSuccessCount())
                .errorCount(job.getErrorCount())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .errors(errors)
                .build();
    }

    public List<ImportErrorResponse> getJobErrors(UUID jobId) {
        UUID tenantId = TenantContext.getTenantId();
        BulkImportJob job = importJobRepository.findByIdAndTenantId(jobId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("ImportJob", "id", jobId));
        return parseErrors(job.getErrorLog());
    }

    // --- Private helpers ---

    private Product validateAndCreateProduct(Map<String, String> row, int rowNum,
                                              List<ImportErrorResponse> errors,
                                              UUID tenantId, UUID userId) {
        String name = getVal(row, "Name");
        if (name == null || name.isBlank()) {
            errors.add(ImportErrorResponse.builder().row(rowNum).field("Name").error("Name is required").build());
            return null;
        }

        Product product = new Product();
        product.setTenantId(tenantId);
        product.setCreatedBy(userId);
        product.setName(name.trim());
        product.setStatus(ProductStatus.DRAFT);

        // SKU
        String sku = getVal(row, "SKU");
        if (sku != null && !sku.isBlank()) {
            product.setSku(sku.trim());
        } else {
            product.setSku(generateSku());
        }

        // Category
        String categoryName = getVal(row, "Category");
        if (categoryName != null && !categoryName.isBlank()) {
            Optional<Category> cat = categoryRepository.findByTenantIdAndName(tenantId, categoryName.trim());
            if (cat.isPresent()) {
                product.setCategoryId(cat.get().getId());
            } else {
                errors.add(ImportErrorResponse.builder().row(rowNum).field("Category")
                        .error("Category '" + categoryName + "' not found").build());
            }
        }

        // Brand
        product.setBrand(getVal(row, "Brand"));

        // MRP
        BigDecimal mrp = parseBigDecimal(row, "MRP", rowNum, errors);
        product.setMrp(mrp);

        // Selling Price
        BigDecimal sellingPrice = parseBigDecimal(row, "SellingPrice", rowNum, errors);
        product.setSellingPrice(sellingPrice);

        // Cost Price
        BigDecimal costPrice = parseBigDecimal(row, "CostPrice", rowNum, errors);
        product.setCostPrice(costPrice);

        // GST Rate
        String gstRate = getVal(row, "GSTRate");
        if (gstRate != null && !gstRate.isBlank()) {
            try {
                product.setGstRate(GstRate.valueOf(gstRate.trim()));
            } catch (IllegalArgumentException e) {
                errors.add(ImportErrorResponse.builder().row(rowNum).field("GSTRate")
                        .error("Invalid GST rate: " + gstRate).build());
            }
        }

        // HSN Code
        product.setHsnCode(getVal(row, "HSNCode"));

        // Unit
        String unit = getVal(row, "Unit");
        if (unit != null && !unit.isBlank()) {
            try {
                product.setUnit(UnitType.valueOf(unit.trim()));
            } catch (IllegalArgumentException e) {
                errors.add(ImportErrorResponse.builder().row(rowNum).field("Unit")
                        .error("Invalid unit: " + unit).build());
            }
        }

        // Stock
        String stockStr = getVal(row, "Stock");
        if (stockStr != null && !stockStr.isBlank()) {
            try {
                product.setCurrentStock(new BigDecimal(stockStr.trim()));
                product.setTrackInventory(true);
            } catch (NumberFormatException e) {
                errors.add(ImportErrorResponse.builder().row(rowNum).field("Stock")
                        .error("Invalid stock number").build());
            }
        }

        // Low Stock Threshold
        String thresholdStr = getVal(row, "LowStockThreshold");
        if (thresholdStr != null && !thresholdStr.isBlank()) {
            try {
                product.setLowStockThreshold(Integer.parseInt(thresholdStr.trim()));
            } catch (NumberFormatException e) {
                errors.add(ImportErrorResponse.builder().row(rowNum).field("LowStockThreshold")
                        .error("Invalid threshold number").build());
            }
        }

        // Tags
        String tags = getVal(row, "Tags");
        if (tags != null && !tags.isBlank()) {
            product.setTags(tags.split("\\|"));
        }

        // Status
        String status = getVal(row, "Status");
        if (status != null && !status.isBlank()) {
            try {
                product.setStatus(ProductStatus.valueOf(status.trim()));
            } catch (IllegalArgumentException e) {
                errors.add(ImportErrorResponse.builder().row(rowNum).field("Status")
                        .error("Invalid status: " + status).build());
            }
        }

        // Generate slug
        String slug = generateSlug(product.getName());
        while (productRepository.existsByTenantIdAndSlug(tenantId, slug)) {
            slug = generateSlug(product.getName()) + "-" + randomAlphanumeric(4);
        }
        product.setSlug(slug);

        return errors.isEmpty() ? product : null;
    }

    private List<Map<String, String>> parseCsv(byte[] bytes) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return rows;

            String[] headers = parseCsvLine(headerLine);

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] values = parseCsvLine(line);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    row.put(headers[i].trim(), i < values.length ? values[i].trim() : "");
                }
                rows.add(row);
            }
        }
        return rows;
    }

    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                fields.add(current.toString());
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }

    private List<Map<String, String>> parseExcel(byte[] bytes) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) return rows;

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return rows;

            String[] headers = new String[headerRow.getLastCellNum()];
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                headers[i] = cell != null ? getCellStringValue(cell) : "";
            }

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                Map<String, String> map = new LinkedHashMap<>();
                boolean hasData = false;
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = row.getCell(i);
                    String val = cell != null ? getCellStringValue(cell) : "";
                    map.put(headers[i].trim(), val.trim());
                    if (!val.isBlank()) hasData = true;
                }
                if (hasData) rows.add(map);
            }
        }
        return rows;
    }

    private String getCellStringValue(Cell cell) {
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                if (val == Math.floor(val)) {
                    yield String.valueOf((long) val);
                }
                yield String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private String getVal(Map<String, String> row, String key) {
        String val = row.get(key);
        if (val == null) {
            // Try case-insensitive lookup
            for (Map.Entry<String, String> entry : row.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(key)) {
                    return entry.getValue();
                }
            }
        }
        return val;
    }

    private BigDecimal parseBigDecimal(Map<String, String> row, String key, int rowNum, List<ImportErrorResponse> errors) {
        String val = getVal(row, key);
        if (val == null || val.isBlank()) return null;
        try {
            BigDecimal bd = new BigDecimal(val.trim());
            if (bd.signum() < 0) {
                errors.add(ImportErrorResponse.builder().row(rowNum).field(key)
                        .error(key + " cannot be negative").build());
                return null;
            }
            return bd;
        } catch (NumberFormatException e) {
            errors.add(ImportErrorResponse.builder().row(rowNum).field(key)
                    .error("Invalid number for " + key).build());
            return null;
        }
    }

    private List<ImportErrorResponse> parseErrors(String errorLog) {
        if (errorLog == null || errorLog.isBlank()) return List.of();
        try {
            return objectMapper.readValue(errorLog,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, ImportErrorResponse.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private ImportJobResponse mapToResponse(BulkImportJob job) {
        return ImportJobResponse.builder()
                .id(job.getId())
                .fileName(job.getFileName())
                .totalRows(job.getTotalRows())
                .processedRows(job.getProcessedRows())
                .successCount(job.getSuccessCount())
                .errorCount(job.getErrorCount())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }

    private String generateSlug(String name) {
        if (name == null) return "";
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private String generateSku() {
        return "IMP-" + randomAlphanumeric(6).toUpperCase();
    }

    private String randomAlphanumeric(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(ThreadLocalRandom.current().nextInt(chars.length())));
        }
        return sb.toString();
    }
}
