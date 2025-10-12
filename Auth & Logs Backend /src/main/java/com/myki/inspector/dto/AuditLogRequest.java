package com.myki.inspector.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AuditLogRequest {
    @NotBlank
    private String action;

    @NotBlank
    private String entityType;

    @Size(max = 120)
    private String entityId;

    @Size(max = 2000)
    private String metadata;
}
