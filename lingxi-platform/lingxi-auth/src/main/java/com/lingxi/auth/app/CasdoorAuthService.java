package com.lingxi.auth.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.core.result.ErrorCode;
import com.lingxi.starter.security.config.LingxiSecurityProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Casdoor OIDC 登录对接：授权地址拼装与 code 换 token。
 */
@Service
public class CasdoorAuthService {

    private final LingxiSecurityProperties properties;
    private final RestClient restClient;

    public CasdoorAuthService(LingxiSecurityProperties properties, RestClient.Builder restClientBuilder) {
        this.properties = properties;
        this.restClient = restClientBuilder.build();
    }

    public Map<String, String> buildLoginUrl(String state) {
        LingxiSecurityProperties.Casdoor casdoor = properties.getCasdoor();
        String resolvedState = StringUtils.hasText(state) ? state : UUID.randomUUID().toString().replace("-", "");
        String url = UriComponentsBuilder
                .fromUriString(trimSlash(casdoor.getEndpoint()) + "/login/oauth/authorize")
                .queryParam("client_id", casdoor.getClientId())
                .queryParam("response_type", "code")
                .queryParam("redirect_uri", casdoor.getRedirectUri())
                .queryParam("scope", "openid profile email")
                .queryParam("state", resolvedState)
                .build(true)
                .toUriString();
        Map<String, String> data = new LinkedHashMap<>();
        data.put("loginUrl", url);
        data.put("state", resolvedState);
        return data;
    }

    public Map<String, Object> exchangeCode(String code) {
        if (!StringUtils.hasText(code)) {
            throw new BizException(ErrorCode.BAD_REQUEST, "code is required");
        }
        LingxiSecurityProperties.Casdoor casdoor = properties.getCasdoor();
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", casdoor.getClientId());
        form.add("client_secret", casdoor.getClientSecret());
        form.add("code", code);
        form.add("redirect_uri", casdoor.getRedirectUri());

        try {
            JsonNode node = restClient.post()
                    .uri(trimSlash(casdoor.getEndpoint()) + "/api/login/oauth/access_token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(JsonNode.class);
            if (node == null) {
                throw new BizException(ErrorCode.UNAUTHORIZED, "empty token response from casdoor");
            }
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("accessToken", text(node, "access_token"));
            data.put("refreshToken", text(node, "refresh_token"));
            data.put("tokenType", text(node, "token_type"));
            data.put("expiresIn", node.path("expires_in").isMissingNode() ? null : node.path("expires_in").asLong());
            data.put("scope", text(node, "scope"));
            return data;
        } catch (BizException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BizException(ErrorCode.UNAUTHORIZED, "casdoor token exchange failed: " + ex.getMessage());
        }
    }

    public String buildLogoutUrl(String redirectUri) {
        LingxiSecurityProperties.Casdoor casdoor = properties.getCasdoor();
        String target = StringUtils.hasText(redirectUri) ? redirectUri : casdoor.getRedirectUri();
        return trimSlash(casdoor.getEndpoint()) + "/login/oauth/logout?id_token_hint=&post_logout_redirect_uri="
                + URLEncoder.encode(target, StandardCharsets.UTF_8);
    }

    private static String trimSlash(String endpoint) {
        if (endpoint.endsWith("/")) {
            return endpoint.substring(0, endpoint.length() - 1);
        }
        return endpoint;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
}
