package com.quickcatalog.service;

import com.quickcatalog.config.TenantContext;
import com.quickcatalog.dto.user.InviteUserRequest;
import com.quickcatalog.dto.user.UpdateRoleRequest;
import com.quickcatalog.dto.user.UserDTO;
import com.quickcatalog.entity.User;
import com.quickcatalog.entity.enums.UserRole;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserDTO> listUsers() {
        UUID tenantId = TenantContext.getTenantId();
        return userRepository.findByTenantId(tenantId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDTO getUser(UUID userId) {
        UUID tenantId = TenantContext.getTenantId();
        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToDTO(user);
    }

    @Transactional
    public UserDTO inviteUser(InviteUserRequest request) {
        UUID tenantId = TenantContext.getTenantId();

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("A user with this email already exists");
        }

        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }

        // Generate a temporary password
        String tempPassword = generateTempPassword();

        User user = new User();
        user.setTenantId(tenantId);
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setRole(role);
        user.setActive(true);

        user = userRepository.save(user);

        log.info("Invited user {} with role {} (temp password generated)", request.getEmail(), role);

        UserDTO dto = mapToDTO(user);
        // In a real system you'd send an email with the temp password
        return dto;
    }

    @Transactional
    public UserDTO updateRole(UUID userId, UpdateRoleRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID currentUserId = TenantContext.getUserId();

        if (userId.equals(currentUserId)) {
            throw new IllegalArgumentException("You cannot change your own role");
        }

        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        UserRole newRole;
        try {
            newRole = UserRole.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + request.getRole());
        }

        user.setRole(newRole);
        user = userRepository.save(user);

        log.info("Updated role for user {} to {}", userId, newRole);
        return mapToDTO(user);
    }

    @Transactional
    public void deactivateUser(UUID userId) {
        UUID tenantId = TenantContext.getTenantId();
        UUID currentUserId = TenantContext.getUserId();

        if (userId.equals(currentUserId)) {
            throw new IllegalArgumentException("You cannot deactivate yourself");
        }

        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setActive(false);
        userRepository.save(user);

        log.info("Deactivated user {}", userId);
    }

    @Transactional
    public UserDTO reactivateUser(UUID userId) {
        UUID tenantId = TenantContext.getTenantId();

        User user = userRepository.findByIdAndTenantId(userId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setActive(true);
        user = userRepository.save(user);

        return mapToDTO(user);
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .active(user.isActive())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return sb.toString();
    }
}
