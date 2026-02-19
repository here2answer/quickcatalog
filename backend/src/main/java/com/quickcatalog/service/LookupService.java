package com.quickcatalog.service;

import com.quickcatalog.dto.lookup.GstRateResponse;
import com.quickcatalog.dto.lookup.HsnSearchResponse;
import com.quickcatalog.dto.lookup.UnitResponse;
import com.quickcatalog.entity.enums.GstRate;
import com.quickcatalog.entity.enums.UnitType;
import com.quickcatalog.repository.HsnMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LookupService {

    private final HsnMasterRepository hsnMasterRepository;

    public List<HsnSearchResponse> searchHsn(String query) {
        return hsnMasterRepository.searchHsn(query).stream()
                .map(hsn -> HsnSearchResponse.builder()
                        .code(hsn.getCode())
                        .description(hsn.getDescription())
                        .gstRate(hsn.getGstRate() != null ? hsn.getGstRate().name() : null)
                        .chapter(hsn.getChapter())
                        .build())
                .collect(Collectors.toList());
    }

    public List<UnitResponse> getUnits() {
        return Arrays.stream(UnitType.values())
                .map(unit -> new UnitResponse(unit.name(), unit.getDisplayName()))
                .collect(Collectors.toList());
    }

    public List<GstRateResponse> getGstRates() {
        return Arrays.stream(GstRate.values())
                .map(gst -> new GstRateResponse(gst.name(), gst.getRate(), gst.getRate() + "%"))
                .collect(Collectors.toList());
    }
}
