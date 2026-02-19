package com.quickcatalog.dto.ai;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AiAcceptRequest {
    @NotNull
    private UUID logId;
    private boolean accepted;
}
