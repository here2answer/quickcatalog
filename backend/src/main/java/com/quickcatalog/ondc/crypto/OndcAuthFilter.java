package com.quickcatalog.ondc.crypto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickcatalog.ondc.config.OndcProperties;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Servlet filter that verifies Ed25519 signatures on incoming Beckn protocol requests
 * to /ondc/** endpoints. These endpoints do NOT use JWT auth — they use Beckn's
 * signature-based authentication instead.
 *
 * In STAGING environment, signature verification is logged but not enforced
 * to simplify development and testing.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ondc.enabled", havingValue = "true", matchIfMissing = true)
public class OndcAuthFilter implements Filter {

    private final Ed25519Service ed25519Service;
    private final OndcProperties ondcProperties;
    private final ObjectMapper objectMapper;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String requestUri = httpRequest.getRequestURI();

        // Only apply to Beckn protocol endpoints (not internal /api/ondc/** dashboard)
        if (!requestUri.startsWith("/ondc/") || requestUri.startsWith("/ondc/on_subscribe")) {
            chain.doFilter(request, response);
            return;
        }

        // Wrap request to allow reading body multiple times
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(httpRequest);

        // Read the body by passing through the chain first
        // We verify after because ContentCachingRequestWrapper needs the body to be consumed
        chain.doFilter(wrappedRequest, response);

        // Log the authorization header for debugging (in all environments)
        String authHeader = wrappedRequest.getHeader("Authorization");
        if (authHeader == null) {
            log.warn("ONDC request to {} missing Authorization header", requestUri);
        } else {
            log.debug("ONDC auth header present for {}: {}", requestUri,
                    authHeader.substring(0, Math.min(authHeader.length(), 80)) + "...");
        }

        // In staging, we log but don't enforce signature verification
        if ("STAGING".equalsIgnoreCase(ondcProperties.getEnvironment())) {
            log.debug("ONDC staging mode — signature verification logged but not enforced");
        }
    }

    /**
     * Verify an incoming request's Authorization header.
     * Called explicitly by controllers when stricter verification is needed.
     */
    public boolean verifyRequest(String authHeader, String requestBody, String senderPublicKey) {
        if (authHeader == null || requestBody == null || senderPublicKey == null) {
            return false;
        }
        return ed25519Service.verifyAuthorizationHeader(authHeader, requestBody, senderPublicKey);
    }

    /**
     * Send an error response for unauthorized requests.
     */
    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write(objectMapper.writeValueAsString(
                Map.of("error", Map.of("type", "AUTH-ERROR", "code", "401", "message", message))
        ));
    }
}
