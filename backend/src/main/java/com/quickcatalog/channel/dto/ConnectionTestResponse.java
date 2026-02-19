package com.quickcatalog.channel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionTestResponse {

    private boolean success;
    private String message;
}
