import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, encryptEnvFile, decryptEnvFile, deriveKey } from './encryption';
import * as crypto from 'crypto';

describe('deriveKey', () => {
  it('should produce a 32-byte key', () => {
    const salt = crypto.randomBytes(32);
    const key = deriveKey('my-passphrase', salt);
    expect(key.length).toBe(32);
  });

  it('should produce the same key for the same inputs', () => {
    const salt = crypto.randomBytes(32);
    const key1 = deriveKey('passphrase', salt);
    const key2 = deriveKey('passphrase', salt);
    expect(key1.equals(key2)).toBe(true);
  });
});

describe('encrypt / decrypt', () => {
  it('should encrypt and decrypt back to original text', () => {
    const original = 'DB_HOST=localhost\nDB_PASS=secret123';
    const passphrase = 'super-secret-passphrase';
    const ciphertext = encrypt(original, passphrase);
    const result = decrypt(ciphertext, passphrase);
    expect(result).toBe(original);
  });

  it('should produce different ciphertexts for the same input (random IV/salt)', () => {
    const passphrase = 'passphrase';
    const text = 'API_KEY=abc123';
    const c1 = encrypt(text, passphrase);
    const c2 = encrypt(text, passphrase);
    expect(c1).not.toBe(c2);
  });

  it('should throw when decrypting with wrong passphrase', () => {
    const ciphertext = encrypt('secret', 'correct-passphrase');
    expect(() => decrypt(ciphertext, 'wrong-passphrase')).toThrow();
  });

  it('should throw on invalid ciphertext', () => {
    expect(() => decrypt('not-valid-base64-data', 'passphrase')).toThrow();
  });
});

describe('encryptEnvFile / decryptEnvFile', () => {
  const envContent = 'NODE_ENV=production\nAPI_SECRET=xyz789\nDB_URL=postgres://localhost/mydb';
  const passphrase = 'team-shared-passphrase';

  it('should round-trip an env file', () => {
    const encrypted = encryptEnvFile(envContent, passphrase);
    const decrypted = decryptEnvFile(encrypted, passphrase);
    expect(decrypted).toBe(envContent);
  });

  it('should throw when passphrase is empty', () => {
    expect(() => encryptEnvFile(envContent, '')).toThrow('Passphrase must not be empty');
    expect(() => decryptEnvFile('anything', '')).toThrow('Passphrase must not be empty');
  });

  it('should throw a user-friendly error on bad decrypt', () => {
    const encrypted = encryptEnvFile(envContent, passphrase);
    expect(() => decryptEnvFile(encrypted, 'wrong')).toThrow(
      'Failed to decrypt: invalid passphrase or corrupted data'
    );
  });
});
