package com.lingxi.auth.app;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String code,
        String state
) {
}
