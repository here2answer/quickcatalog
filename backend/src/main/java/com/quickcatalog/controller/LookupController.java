package com.quickcatalog.controller;

import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.lookup.GstRateResponse;
import com.quickcatalog.dto.lookup.HsnSearchResponse;
import com.quickcatalog.dto.lookup.UnitResponse;
import com.quickcatalog.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lookup")
@RequiredArgsConstructor
public class LookupController {

    private final LookupService lookupService;

    @GetMapping("/hsn")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<HsnSearchResponse>> searchHsn(@RequestParam String q) {
        List<HsnSearchResponse> response = lookupService.searchHsn(q);
        return ApiResponse.success(response);
    }

    @GetMapping("/units")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<UnitResponse>> getUnits() {
        List<UnitResponse> response = lookupService.getUnits();
        return ApiResponse.success(response);
    }

    @GetMapping("/gst-rates")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<GstRateResponse>> getGstRates() {
        List<GstRateResponse> response = lookupService.getGstRates();
        return ApiResponse.success(response);
    }
}
