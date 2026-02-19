package com.quickcatalog.dto.lookup;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class GstRateResponse {
    private String value;
    private BigDecimal rate;
    private String displayName;
}
