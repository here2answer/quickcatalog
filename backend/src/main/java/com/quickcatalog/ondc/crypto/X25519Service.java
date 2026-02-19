package com.quickcatalog.ondc.crypto;

import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.crypto.agreement.X25519Agreement;
import org.bouncycastle.crypto.params.X25519PrivateKeyParameters;
import org.bouncycastle.crypto.params.X25519PublicKeyParameters;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

/**
 * Handles X25519 key exchange and AES decryption for the ONDC registry
 * on_subscribe challenge. ONDC sends an encrypted challenge that must be
 * decrypted using the shared secret derived from X25519.
 */
@Slf4j
@Service
public class X25519Service {

    /**
     * Derive a shared secret using X25519 key agreement.
     *
     * @param ourPrivateKeyBase64 Our X25519 private key (base64)
     * @param theirPublicKeyBase64 ONDC's X25519 public key (base64)
     * @return Shared secret bytes (32 bytes)
     */
    public byte[] deriveSharedSecret(String ourPrivateKeyBase64, String theirPublicKeyBase64) {
        try {
            byte[] privateKeyBytes = Base64.getDecoder().decode(ourPrivateKeyBase64);
            byte[] publicKeyBytes = Base64.getDecoder().decode(theirPublicKeyBase64);

            X25519PrivateKeyParameters privateKey = new X25519PrivateKeyParameters(privateKeyBytes, 0);

            // ONDC public key may be in raw 32-byte or ASN.1 DER format
            X25519PublicKeyParameters publicKey;
            if (publicKeyBytes.length == 32) {
                publicKey = new X25519PublicKeyParameters(publicKeyBytes, 0);
            } else {
                // ASN.1 DER format — extract raw 32 bytes (last 32 bytes)
                byte[] rawPublicKey = new byte[32];
                System.arraycopy(publicKeyBytes, publicKeyBytes.length - 32, rawPublicKey, 0, 32);
                publicKey = new X25519PublicKeyParameters(rawPublicKey, 0);
            }

            X25519Agreement agreement = new X25519Agreement();
            agreement.init(privateKey);

            byte[] sharedSecret = new byte[agreement.getAgreementSize()];
            agreement.calculateAgreement(publicKey, sharedSecret, 0);

            return sharedSecret;
        } catch (Exception e) {
            log.error("X25519 key exchange failed", e);
            throw new RuntimeException("Failed to derive shared secret", e);
        }
    }

    /**
     * Decrypt the ONDC registry challenge using AES with the shared secret.
     *
     * @param encryptedChallenge The encrypted challenge string (base64)
     * @param ourPrivateKeyBase64 Our X25519 private key
     * @param ondcPublicKeyBase64 ONDC's X25519 public key
     * @return The decrypted challenge plaintext
     */
    public String decryptChallenge(String encryptedChallenge, String ourPrivateKeyBase64,
                                   String ondcPublicKeyBase64) {
        try {
            byte[] sharedSecret = deriveSharedSecret(ourPrivateKeyBase64, ondcPublicKeyBase64);

            // Use the shared secret as AES key (first 32 bytes)
            SecretKeySpec keySpec = new SecretKeySpec(sharedSecret, "AES");
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, keySpec);

            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedChallenge);
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);

            return new String(decryptedBytes);
        } catch (Exception e) {
            log.error("Failed to decrypt ONDC challenge", e);
            throw new RuntimeException("Failed to decrypt challenge", e);
        }
    }
}
