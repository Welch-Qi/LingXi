package com.lingxi.auth.app;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingxi.starter.core.exception.BizException;
import com.lingxi.starter.security.config.LingxiSecurityProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CasdoorAuthServiceTest {

    private LingxiSecurityProperties properties;
    private MockRestServiceServer server;
    private CasdoorAuthService service;

    @BeforeEach
    void setUp() {
        properties = new LingxiSecurityProperties();
        properties.getCasdoor().setEndpoint("http://localhost:8000");
        properties.getCasdoor().setClientId("lingxi-web");
        properties.getCasdoor().setClientSecret("lingxi-secret");
        properties.getCasdoor().setRedirectUri("http://localhost:3000/auth/callback");

        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new CasdoorAuthService(properties, builder);
    }

    @Test
    void buildLoginUrlContainsClientIdAndState() {
        Map<String, String> result = service.buildLoginUrl("custom-state");

        assertThat(result.get("loginUrl"))
                .contains("client_id=lingxi-web")
                .contains("response_type=code")
                .contains("state=custom-state");
        assertThat(result.get("state")).isEqualTo("custom-state");
    }

    @Test
    void buildLoginUrlGeneratesStateWhenMissing() {
        Map<String, String> result = service.buildLoginUrl(null);

        assertThat(result.get("state")).isNotBlank();
        assertThat(result.get("loginUrl")).contains("state=" + result.get("state"));
    }

    @Test
    void exchangeCodeReturnsTokenPayload() throws Exception {
        String body = new ObjectMapper().writeValueAsString(Map.of(
                "access_token", "access-token",
                "refresh_token", "refresh-token",
                "token_type", "Bearer",
                "expires_in", 3600,
                "scope", "openid profile email"));
        server.expect(requestTo("http://localhost:8000/api/login/oauth/access_token"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        Map<String, Object> token = service.exchangeCode("auth-code");

        assertThat(token.get("accessToken")).isEqualTo("access-token");
        assertThat(token.get("refreshToken")).isEqualTo("refresh-token");
        assertThat(token.get("tokenType")).isEqualTo("Bearer");
        assertThat(token.get("expiresIn")).isEqualTo(3600L);
        assertThat(token.get("scope")).isEqualTo("openid profile email");
        server.verify();
    }

    @Test
    void exchangeCodeRejectsBlankCode() {
        assertThatThrownBy(() -> service.exchangeCode(" "))
                .isInstanceOf(BizException.class)
                .hasMessageContaining("code is required");
    }

    @Test
    void buildLogoutUrlUsesRedirectUri() {
        String logoutUrl = service.buildLogoutUrl("http://localhost:3000/logout");

        assertThat(logoutUrl)
                .startsWith("http://localhost:8000/login/oauth/logout")
                .contains("post_logout_redirect_uri=");
    }
}
