package com.quickcatalog.dto.product;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProductStatusRequest {
    @NotBlank(message = "Status is required")
    private String status;
}
