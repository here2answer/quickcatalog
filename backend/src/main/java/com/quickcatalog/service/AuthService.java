package com.quickcatalog.service;

import com.quickcatalog.dto.auth.*;
import com.quickcatalog.entity.Tenant;
import com.quickcatalog.entity.User;
import com.quickcatalog.entity.enums.SubscriptionPlan;
import com.quickcatalog.entity.enums.UserRole;
import com.quickcatalog.exception.DuplicateResourceException;
import com.quickcatalog.exception.ResourceNotFoundException;
import com.quickcatalog.exception.UnauthorizedException;
import com.quickcatalog.repository.TenantRepository;
import com.quickcatalog.repository.UserRepository;
import com.quickcatalog.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public LoginResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + req.getEmail());
        }

        Tenant tenant = new Tenant();
        tenant.setCompanyName(req.getCompanyName());
        tenant.setGstin(req.getGstin());
        tenant.setActive(true);
        tenant.setSubscriptionPlan(SubscriptionPlan.FREE);
        tenant = tenantRepository.save(tenant);

        User user = new User();
        user.setTenantId(tenant.getId());
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(UserRole.OWNER);
        user.setActive(true);
        user.setLastLoginAt(LocalDateTime.now());
        user = userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), tenant.getId(), user.getEmail(), user.getRole().name()
        );
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), tenant.getId());

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .tenantId(tenant.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .companyName(tenant.getCompanyName())
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }

    public LoginResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        Tenant tenant = tenantRepository.findById(user.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", user.getTenantId()));

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), tenant.getId(), user.getEmail(), user.getRole().name()
        );
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), tenant.getId());

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .tenantId(tenant.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .companyName(tenant.getCompanyName())
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }

    public LoginResponse refreshToken(RefreshRequest req) {
        String token = req.getRefreshToken();

        if (!jwtTokenProvider.validateToken(token)) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        String tokenType = jwtTokenProvider.getTokenType(token);
        if (!"refresh".equals(tokenType)) {
            throw new UnauthorizedException("Invalid token type, expected refresh token");
        }

        UUID userId = jwtTokenProvider.getUserIdFromToken(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Tenant tenant = tenantRepository.findById(user.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", user.getTenantId()));

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), tenant.getId(), user.getEmail(), user.getRole().name()
        );
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), tenant.getId());

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .tenantId(tenant.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .companyName(tenant.getCompanyName())
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public UserResponse getCurrentUser(UUID userId, UUID tenantId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "id", tenantId));

        return UserResponse.builder()
                .id(user.getId())
                .tenantId(tenant.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .companyName(tenant.getCompanyName())
                .build();
    }
}
