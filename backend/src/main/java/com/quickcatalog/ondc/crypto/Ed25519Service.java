package com.quickcatalog.ondc.crypto;

import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.crypto.Signer;
import org.bouncycastle.crypto.digests.Blake2bDigest;
import org.bouncycastle.crypto.params.Ed25519PrivateKeyParameters;
import org.bouncycastle.crypto.params.Ed25519PublicKeyParameters;
import org.bouncycastle.crypto.signers.Ed25519Signer;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

/**
 * Handles Ed25519 signing and verification for the Beckn protocol.
 * Every ONDC API call must include a digitally signed Authorization header.
 */
@Slf4j
@Service
public class Ed25519Service {

    /**
     * Compute BLAKE-512 hash of the request body.
     */
    public String blakeHash(String requestBody) {
        Blake2bDigest digest = new Blake2bDigest(512);
        byte[] input = requestBody.getBytes(StandardCharsets.UTF_8);
        digest.update(input, 0, input.length);
        byte[] hash = new byte[64];
        digest.doFinal(hash, 0);
        return Base64.getEncoder().encodeToString(hash);
    }

    /**
     * Build the signing string per Beckn protocol spec.
     * Format: (created): {timestamp}\n(expires): {timestamp+300}\ndigest: BLAKE-512={hash}
     */
    public String buildSigningString(long created, long expires, String blakeHash) {
        return "(created): " + created + "\n" +
                "(expires): " + expires + "\n" +
                "digest: BLAKE-512=" + blakeHash;
    }

    /**
     * Sign a string using Ed25519 private key.
     */
    public String sign(String signingString, String privateKeyBase64) {
        try {
            byte[] privateKeyBytes = Base64.getDecoder().decode(privateKeyBase64);
            Ed25519PrivateKeyParameters privateKey = new Ed25519PrivateKeyParameters(privateKeyBytes, 0);

            Signer signer = new Ed25519Signer();
            signer.init(true, privateKey);

            byte[] message = signingString.getBytes(StandardCharsets.UTF_8);
            signer.update(message, 0, message.length);
            byte[] signature = signer.generateSignature();

            return Base64.getEncoder().encodeToString(signature);
        } catch (Exception e) {
            log.error("Ed25519 signing failed", e);
            throw new RuntimeException("Failed to sign message", e);
        }
    }

    /**
     * Verify an Ed25519 signature.
     */
    public boolean verify(String signingString, String signatureBase64, String publicKeyBase64) {
        try {
            byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyBase64);
            Ed25519PublicKeyParameters publicKey = new Ed25519PublicKeyParameters(publicKeyBytes, 0);

            Signer verifier = new Ed25519Signer();
            verifier.init(false, publicKey);

            byte[] message = signingString.getBytes(StandardCharsets.UTF_8);
            verifier.update(message, 0, message.length);

            byte[] signature = Base64.getDecoder().decode(signatureBase64);
            return verifier.verifySignature(signature);
        } catch (Exception e) {
            log.error("Ed25519 verification failed", e);
            return false;
        }
    }

    /**
     * Build the full Authorization header for an outgoing Beckn callback.
     */
    public String buildAuthorizationHeader(String requestBody, String subscriberId,
                                           String uniqueKeyId, String privateKeyBase64) {
        long created = Instant.now().getEpochSecond();
        long expires = created + 300; // 5 minutes

        String hash = blakeHash(requestBody);
        String signingString = buildSigningString(created, expires, hash);
        String signature = sign(signingString, privateKeyBase64);

        return String.format(
                "Signature keyId=\"%s|%s|ed25519\",algorithm=\"ed25519\"," +
                        "created=\"%d\",expires=\"%d\"," +
                        "headers=\"(created) (expires) digest\"," +
                        "signature=\"%s\"",
                subscriberId, uniqueKeyId, created, expires, signature
        );
    }

    /**
     * Parse an incoming Authorization header and verify the signature.
     *
     * @param authHeader The Authorization header value
     * @param requestBody The raw request body
     * @param senderPublicKey The sender's Ed25519 public key (looked up from registry)
     * @return true if signature is valid and not expired
     */
    public boolean verifyAuthorizationHeader(String authHeader, String requestBody,
                                              String senderPublicKey) {
        try {
            // Parse header fields
            String created = extractField(authHeader, "created");
            String expires = extractField(authHeader, "expires");
            String signature = extractField(authHeader, "signature");

            if (created == null || expires == null || signature == null) {
                log.warn("Missing fields in Authorization header");
                return false;
            }

            // Check expiry
            long expiresLong = Long.parseLong(expires);
            if (Instant.now().getEpochSecond() > expiresLong) {
                log.warn("Authorization header expired");
                return false;
            }

            // Rebuild signing string and verify
            String hash = blakeHash(requestBody);
            String signingString = buildSigningString(Long.parseLong(created), expiresLong, hash);

            return verify(signingString, signature, senderPublicKey);
        } catch (Exception e) {
            log.error("Failed to verify Authorization header", e);
            return false;
        }
    }

    private String extractField(String header, String fieldName) {
        String pattern = fieldName + "=\"";
        int start = header.indexOf(pattern);
        if (start == -1) return null;
        start += pattern.length();
        int end = header.indexOf("\"", start);
        if (end == -1) return null;
        return header.substring(start, end);
    }
}
