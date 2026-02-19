package com.quickcatalog.controller;

import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.dashboard.DashboardSummaryResponse;
import com.quickcatalog.dto.dashboard.RecentActivityResponse;
import com.quickcatalog.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<DashboardSummaryResponse> getSummary() {
        DashboardSummaryResponse response = dashboardService.getSummary();
        return ApiResponse.success(response);
    }

    @GetMapping("/recent-activity")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<RecentActivityResponse>> getRecentActivity() {
        List<RecentActivityResponse> response = dashboardService.getRecentActivity();
        return ApiResponse.success(response);
    }
}
