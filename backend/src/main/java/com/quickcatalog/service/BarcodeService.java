package com.quickcatalog.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.oned.EAN13Writer;
import com.quickcatalog.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
public class BarcodeService {

    public String generateEan13() {
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            digits.append(ThreadLocalRandom.current().nextInt(10));
        }
        int checkDigit = calculateEan13CheckDigit(digits.toString());
        digits.append(checkDigit);
        return digits.toString();
    }

    public byte[] generateBarcodeImage(String barcodeValue) {
        if (!validateEan13(barcodeValue)) {
            throw new BadRequestException("Invalid EAN-13 barcode: " + barcodeValue);
        }

        try {
            EAN13Writer writer = new EAN13Writer();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 10);

            BitMatrix matrix = writer.encode(barcodeValue, BarcodeFormat.EAN_13, 300, 150, hints);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Barcode generation failed for value {}: {}", barcodeValue, e.getMessage());
            throw new BadRequestException("Failed to generate barcode image");
        }
    }

    public boolean validateEan13(String value) {
        if (value == null || value.length() != 13 || !value.matches("\\d{13}")) {
            return false;
        }
        int expectedCheck = calculateEan13CheckDigit(value.substring(0, 12));
        return expectedCheck == Character.getNumericValue(value.charAt(12));
    }

    private int calculateEan13CheckDigit(String first12) {
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int digit = Character.getNumericValue(first12.charAt(i));
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        int remainder = sum % 10;
        return (remainder == 0) ? 0 : 10 - remainder;
    }
}
