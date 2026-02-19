package com.quickcatalog.controller;

import com.quickcatalog.dto.barcode.BarcodeResponse;
import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.common.PagedResponse;
import com.quickcatalog.dto.product.*;
import com.quickcatalog.service.BarcodeService;
import com.quickcatalog.service.DuplicateDetectionService;
import com.quickcatalog.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final BarcodeService barcodeService;
    private final DuplicateDetectionService duplicateDetectionService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PagedResponse<ProductListResponse>> list(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<ProductListResponse> response = productService.list(categoryId, status, sort, page, size);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<ProductResponse> getById(@PathVariable UUID id) {
        ProductResponse response = productService.getById(id);
        return ApiResponse.success(response);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ProductResponse> create(@Valid @RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.create(request);
        return ApiResponse.success(response);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ProductResponse> update(@PathVariable UUID id,
                                               @Valid @RequestBody ProductUpdateRequest request) {
        ProductResponse response = productService.update(id, request);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        productService.delete(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<Void> changeStatus(@PathVariable UUID id,
                                          @Valid @RequestBody ProductStatusRequest request) {
        productService.changeStatus(id, request);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<ProductResponse> duplicate(@PathVariable UUID id) {
        ProductResponse response = productService.duplicate(id);
        return ApiResponse.success(response);
    }

    @GetMapping("/search")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<PagedResponse<ProductListResponse>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String barcode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (barcode != null && !barcode.isBlank()) {
            ProductListResponse product = productService.findByBarcode(barcode);
            PagedResponse<ProductListResponse> response = PagedResponse.of(List.of(product), 0, 1, 1, 1);
            return ApiResponse.success(response);
        }
        PagedResponse<ProductListResponse> response = productService.search(q != null ? q : "", page, size);
        return ApiResponse.success(response);
    }

    @GetMapping("/low-stock")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<ProductListResponse>> getLowStock() {
        List<ProductListResponse> response = productService.getLowStock();
        return ApiResponse.success(response);
    }

    @PostMapping("/{id}/generate-barcode")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','EDITOR')")
    public ApiResponse<BarcodeResponse> generateBarcode(@PathVariable UUID id) {
        String barcodeValue = barcodeService.generateEan13();
        String imageBase64 = java.util.Base64.getEncoder()
                .encodeToString(barcodeService.generateBarcodeImage(barcodeValue));
        return ApiResponse.success(BarcodeResponse.builder()
                .barcodeValue(barcodeValue)
                .barcodeImageBase64(imageBase64)
                .build());
    }

    @GetMapping("/{id}/barcode-image")
    public ResponseEntity<byte[]> getBarcodeImage(@PathVariable UUID id,
                                                  @RequestParam String value) {
        byte[] image = barcodeService.generateBarcodeImage(value);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentLength(image.length);
        return new ResponseEntity<>(image, headers, HttpStatus.OK);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam(defaultValue = "csv") String format) {
        if ("excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format)) {
            byte[] excelBytes = productService.exportExcel();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "products.xlsx");
            headers.setContentLength(excelBytes.length);
            return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
        }

        byte[] csvBytes = productService.exportCsv();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "products.csv");
        headers.setContentLength(csvBytes.length);
        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/{id}/duplicates")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<DuplicateGroupResponse> findDuplicates(@PathVariable UUID id) {
        DuplicateGroupResponse response = duplicateDetectionService.findDuplicates(id);
        return ApiResponse.success(response);
    }

    @GetMapping("/duplicates/scan")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<List<DuplicateGroupResponse>> scanDuplicates() {
        List<DuplicateGroupResponse> response = duplicateDetectionService.scanForDuplicates();
        return ApiResponse.success(response);
    }
}
