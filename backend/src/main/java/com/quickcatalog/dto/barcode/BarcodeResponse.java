package com.quickcatalog.dto.barcode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarcodeResponse {
    private String barcodeValue;
    private String barcodeImageBase64;
}
