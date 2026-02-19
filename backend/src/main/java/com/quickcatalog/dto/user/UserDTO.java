package com.quickcatalog.dto.user;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserDTO {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private boolean active;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
}
