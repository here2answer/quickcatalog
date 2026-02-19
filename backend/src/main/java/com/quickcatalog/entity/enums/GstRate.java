package com.quickcatalog.entity.enums;

import java.math.BigDecimal;

public enum GstRate {

    GST_0(BigDecimal.ZERO),
    GST_5(new BigDecimal("5")),
    GST_12(new BigDecimal("12")),
    GST_18(new BigDecimal("18")),
    GST_28(new BigDecimal("28"));

    private final BigDecimal rate;

    GstRate(BigDecimal rate) {
        this.rate = rate;
    }

    public BigDecimal getRate() {
        return rate;
    }
}
