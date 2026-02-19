package com.quickcatalog.channel.controller;

import com.quickcatalog.channel.dto.ChannelRequest;
import com.quickcatalog.channel.dto.ChannelResponse;
import com.quickcatalog.channel.dto.ConnectionTestResponse;
import com.quickcatalog.channel.dto.FieldMappingTemplate;
import com.quickcatalog.channel.service.ChannelService;
import com.quickcatalog.dto.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @GetMapping
    public ApiResponse<List<ChannelResponse>> list() {
        return ApiResponse.success(channelService.listChannels());
    }

    @GetMapping("/{id}")
    public ApiResponse<ChannelResponse> getById(@PathVariable UUID id) {
        return ApiResponse.success(channelService.getChannel(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<ChannelResponse> create(@Valid @RequestBody ChannelRequest request) {
        return ApiResponse.success(channelService.createChannel(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<ChannelResponse> update(@PathVariable UUID id,
                                                @Valid @RequestBody ChannelRequest request) {
        return ApiResponse.success(channelService.updateChannel(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        channelService.deleteChannel(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/test-connection")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ApiResponse<ConnectionTestResponse> testConnection(@PathVariable UUID id) {
        return ApiResponse.success(channelService.testConnection(id));
    }

    @GetMapping("/{id}/field-mapping-template")
    public ApiResponse<List<FieldMappingTemplate>> getFieldMappingTemplate(@PathVariable UUID id) {
        return ApiResponse.success(channelService.getFieldMappingTemplate(id));
    }
}
