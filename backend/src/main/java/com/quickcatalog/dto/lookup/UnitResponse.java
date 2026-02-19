package com.quickcatalog.dto.lookup;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UnitResponse {
    private String value;
    private String displayName;
}
