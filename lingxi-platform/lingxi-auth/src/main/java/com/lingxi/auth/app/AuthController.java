package com.lingxi.auth.app;

import com.lingxi.starter.core.result.Result;
import com.lingxi.starter.core.security.UserContext;
import com.lingxi.starter.security.permission.PermissionDecisionClient;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final CasdoorAuthService casdoorAuthService;
    private final PermissionDecisionClient permissionDecisionClient;

    public AuthController(CasdoorAuthService casdoorAuthService,
                          PermissionDecisionClient permissionDecisionClient) {
        this.casdoorAuthService = casdoorAuthService;
        this.permissionDecisionClient = permissionDecisionClient;
    }

    /**
     * 获取 Casdoor 登录地址。
     */
    @GetMapping("/login-url")
    public Result<Map<String, String>> loginUrl(@RequestParam(required = false) String state) {
        return Result.ok(casdoorAuthService.buildLoginUrl(state));
    }

    /**
     * 授权码换 Token（前端回调后调用）。
     */
    @PostMapping("/callback")
    public Result<Map<String, Object>> callback(@RequestParam String code,
                                                @RequestParam(required = false) String state) {
        Map<String, Object> token = casdoorAuthService.exchangeCode(code);
        token.put("state", state);
        return Result.ok(token);
    }

    /**
     * 用户登录：Casdoor OIDC 授权码换 Token（契约对齐入口）。
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        Map<String, Object> token = casdoorAuthService.exchangeCode(req.code());
        token.put("state", req.state());
        return Result.ok(token);
    }

    /**
     * 当前登录用户（需 Bearer Token 或开发旁路头）。
     */
    @GetMapping("/me")
    public Result<Map<String, Object>> me() {
        UserContext.UserPrincipal principal = UserContext.require();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("userId", principal.getUserId());
        data.put("username", principal.getUsername());
        data.put("displayName", principal.getDisplayName());
        data.put("tenantId", principal.getTenantId());
        data.put("roles", principal.getRoles());
        data.put("dataScope", principal.getDataScope().name());
        data.put("permissions", permissionDecisionClient.listPermissions(
                principal.getUserId(), principal.getTenantId()));
        return Result.ok(data);
    }

    @GetMapping("/logout-url")
    public Result<Map<String, String>> logoutUrl(@RequestParam(required = false) String redirectUri) {
        return Result.ok(Map.of("logoutUrl", casdoorAuthService.buildLogoutUrl(redirectUri)));
    }
}
