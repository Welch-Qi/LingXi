package com.lingxi.workbench.app;

import java.time.Instant;

public record UpdateTaskRequest(
        String status,
        Integer priority,
        Long assigneeId,
        Instant dueAt
) {}
