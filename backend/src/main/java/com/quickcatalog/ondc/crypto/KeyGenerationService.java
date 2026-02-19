package com.quickcatalog.ondc.crypto;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.crypto.AsymmetricCipherKeyPair;
import org.bouncycastle.crypto.generators.Ed25519KeyPairGenerator;
import org.bouncycastle.crypto.generators.X25519KeyPairGenerator;
import org.bouncycastle.crypto.params.*;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Service
public class KeyGenerationService {

    /**
     * Generate an Ed25519 signing key pair for Beckn protocol message signing.
     */
    public KeyPairResult generateSigningKeyPair() {
        Ed25519KeyPairGenerator generator = new Ed25519KeyPairGenerator();
        generator.init(new Ed25519KeyGenerationParameters(new SecureRandom()));
        AsymmetricCipherKeyPair keyPair = generator.generateKeyPair();

        Ed25519PublicKeyParameters publicKey = (Ed25519PublicKeyParameters) keyPair.getPublic();
        Ed25519PrivateKeyParameters privateKey = (Ed25519PrivateKeyParameters) keyPair.getPrivate();

        String publicKeyBase64 = Base64.getEncoder().encodeToString(publicKey.getEncoded());
        String privateKeyBase64 = Base64.getEncoder().encodeToString(privateKey.getEncoded());

        log.info("Generated Ed25519 signing key pair");
        return new KeyPairResult(publicKeyBase64, privateKeyBase64);
    }

    /**
     * Generate an X25519 encryption key pair for ONDC registry challenge decryption.
     */
    public KeyPairResult generateEncryptionKeyPair() {
        X25519KeyPairGenerator generator = new X25519KeyPairGenerator();
        generator.init(new X25519KeyGenerationParameters(new SecureRandom()));
        AsymmetricCipherKeyPair keyPair = generator.generateKeyPair();

        X25519PublicKeyParameters publicKey = (X25519PublicKeyParameters) keyPair.getPublic();
        X25519PrivateKeyParameters privateKey = (X25519PrivateKeyParameters) keyPair.getPrivate();

        String publicKeyBase64 = Base64.getEncoder().encodeToString(publicKey.getEncoded());
        String privateKeyBase64 = Base64.getEncoder().encodeToString(privateKey.getEncoded());

        log.info("Generated X25519 encryption key pair");
        return new KeyPairResult(publicKeyBase64, privateKeyBase64);
    }

    @Data
    public static class KeyPairResult {
        private final String publicKey;
        private final String privateKey;
    }
}
