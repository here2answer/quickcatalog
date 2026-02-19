package com.quickcatalog.controller;

import com.quickcatalog.dto.common.ApiResponse;
import com.quickcatalog.dto.user.InviteUserRequest;
import com.quickcatalog.dto.user.UpdateRoleRequest;
import com.quickcatalog.dto.user.UserDTO;
import com.quickcatalog.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userManagementService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<List<UserDTO>> listUsers() {
        List<UserDTO> users = userManagementService.listUsers();
        return ApiResponse.success(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<UserDTO> getUser(@PathVariable UUID id) {
        UserDTO user = userManagementService.getUser(id);
        return ApiResponse.success(user);
    }

    @PostMapping("/invite")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<UserDTO> inviteUser(@Valid @RequestBody InviteUserRequest request) {
        UserDTO user = userManagementService.inviteUser(request);
        return ApiResponse.success(user);
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<UserDTO> updateRole(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateRoleRequest request) {
        UserDTO user = userManagementService.updateRole(id, request);
        return ApiResponse.success(user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<Void> deactivateUser(@PathVariable UUID id) {
        userManagementService.deactivateUser(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<UserDTO> reactivateUser(@PathVariable UUID id) {
        UserDTO user = userManagementService.reactivateUser(id);
        return ApiResponse.success(user);
    }
}
