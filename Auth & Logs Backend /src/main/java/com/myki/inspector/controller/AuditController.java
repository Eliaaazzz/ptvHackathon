package com.myki.inspector.controller;

import com.myki.inspector.dto.AuditLogRequest;
import com.myki.inspector.service.AuditService;
import com.myki.inspector.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @PostMapping
    public ResponseEntity<Void> logEvent(@Valid @RequestBody AuditLogRequest request, HttpServletRequest httpRequest) {
        String inspectorId = SecurityUtils.currentInspectorId();
        auditService.log(
                inspectorId,
                request.getAction(),
                request.getEntityType(),
                request.getEntityId(),
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent"),
                request.getMetadata()
        );
        return ResponseEntity.accepted().build();
    }
}
