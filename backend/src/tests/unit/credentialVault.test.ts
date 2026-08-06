import { describe, expect, it } from "vitest";

interface EncryptedSecret {
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: number;
  aadVersion: 1;
}

interface EncryptionKeyRing {
  currentVersion?: number;
  keys: ReadonlyMap<number, Buffer>;
}

interface VaultModule {
  parseEncryptionKeyRing(input: {
    current?: string;
    previous?: string;
  }): EncryptionKeyRing;
  encryptCredential(input: {
    plaintext: Buffer;
    credentialId: string;
    userId: string;
    provider: string;
    secretVersion: number;
    keyRing: EncryptionKeyRing;
    nonceFactory?: (size: number) => Buffer;
  }): EncryptedSecret;
  decryptCredential(input: {
    encryptedSecret: EncryptedSecret;
    credentialId: string;
    userId: string;
    provider: string;
    secretVersion: number;
    keyRing: EncryptionKeyRing;
  }): Buffer;
  reencryptCredential(input: {
    encryptedSecret: EncryptedSecret;
    credentialId: string;
    userId: string;
    provider: string;
    secretVersion: number;
    sourceKeyRing: EncryptionKeyRing;
    targetKeyRing: EncryptionKeyRing;
    nonceFactory?: (size: number) => Buffer;
  }): EncryptedSecret;
  maskCredentialSuffix(secret: string): string;
  clearSecretBuffer(secret: Buffer): void;
}

const modulePath = "../../modules/ai/credentialVault.js";
const currentKeyBytes = Buffer.from(
  Array.from({ length: 32 }, (_value, index) => index),
);
const replacementKeyBytes = Buffer.alloc(32, 0x42);
const currentKey = `v7:${currentKeyBytes.toString("base64url")}`;
const replacementKey = `v8:${replacementKeyBytes.toString("base64url")}`;
const credentialId = "64b64b64b64b64b64b64b64b";
const userId = "64a64a64a64a64a64a64a64a";
const plaintext = "synthetic-provider-key";

async function loadVault(): Promise<Partial<VaultModule>> {
  return import(modulePath) as Promise<Partial<VaultModule>>;
}

function flipEncodedByte(value: string): string {
  const bytes = Buffer.from(value, "base64url");
  bytes[0] ^= 0x01;
  return bytes.toString("base64url");
}

describe("AI credential vault", () => {
  it("parses a valid current key", async () => {
    const { parseEncryptionKeyRing } = await loadVault();
    expect(parseEncryptionKeyRing).toBeTypeOf("function");
    if (!parseEncryptionKeyRing) return;

    const ring = parseEncryptionKeyRing({ current: currentKey });

    expect(ring.currentVersion).toBe(7);
    expect(ring.keys.get(7)).toEqual(currentKeyBytes);
  });

  it("parses a valid decrypt-only previous-key ring", async () => {
    const { parseEncryptionKeyRing } = await loadVault();
    if (!parseEncryptionKeyRing) return;

    const ring = parseEncryptionKeyRing({
      current: replacementKey,
      previous: `${currentKey},v6:${Buffer.alloc(32, 0x11).toString("base64url")}`,
    });

    expect(ring.currentVersion).toBe(8);
    expect([...ring.keys.keys()]).toEqual([8, 7, 6]);
  });

  it("keeps the key ring optional", async () => {
    const { parseEncryptionKeyRing } = await loadVault();
    if (!parseEncryptionKeyRing) return;

    expect(parseEncryptionKeyRing({})).toEqual({
      currentVersion: undefined,
      keys: new Map(),
    });
  });

  it.each([
    ["duplicate versions", currentKey, currentKey],
    ["invalid length", `v1:${Buffer.alloc(31).toString("base64url")}`, undefined],
    ["invalid Base64URL", `v1:${"A".repeat(42)}+`, undefined],
    ["padded encoding", `v1:${Buffer.alloc(32).toString("base64url")}=`, undefined],
    ["missing version", currentKey.slice(currentKey.indexOf(":") + 1), undefined],
    ["zero version", `v0:${currentKeyBytes.toString("base64url")}`, undefined],
    ["negative version", `v-1:${currentKeyBytes.toString("base64url")}`, undefined],
    ["non-integer version", `v1.5:${currentKeyBytes.toString("base64url")}`, undefined],
    [
      "placeholder text",
      `v1:${Buffer.from("replace-with-example-key-material!").toString("base64url")}`,
      undefined,
    ],
  ])("rejects %s", async (_label, current, previous) => {
    const { parseEncryptionKeyRing } = await loadVault();
    if (!parseEncryptionKeyRing) return;

    expect(() =>
      parseEncryptionKeyRing({ current, previous }),
    ).toThrow("Invalid BYOK encryption key configuration.");
  });

  it("rejects previous keys without a current encryption key", async () => {
    const { parseEncryptionKeyRing } = await loadVault();
    if (!parseEncryptionKeyRing) return;

    expect(() =>
      parseEncryptionKeyRing({ previous: currentKey }),
    ).toThrow("Invalid BYOK encryption key configuration.");
  });

  it("matches the deterministic AES-256-GCM test vector", async () => {
    const { parseEncryptionKeyRing, encryptCredential } = await loadVault();
    expect(encryptCredential).toBeTypeOf("function");
    if (!parseEncryptionKeyRing || !encryptCredential) return;

    const encrypted = encryptCredential({
      plaintext: Buffer.from(plaintext),
      credentialId,
      userId,
      provider: "gemini-direct",
      secretVersion: 1,
      keyRing: parseEncryptionKeyRing({ current: currentKey }),
      nonceFactory: () => Buffer.from(Array.from({ length: 12 }, (_value, index) => index)),
    });

    expect(encrypted).toEqual({
      ciphertext: "NHu4b62AtnLubOf53p8RCeakql-VAg",
      nonce: "AAECAwQFBgcICQoL",
      authTag: "jb1n-rS3_GiuaU_A-aG1wA",
      keyVersion: 7,
      aadVersion: 1,
    });
  });

  it("round trips a credential", async () => {
    const { parseEncryptionKeyRing, encryptCredential, decryptCredential } =
      await loadVault();
    if (!parseEncryptionKeyRing || !encryptCredential || !decryptCredential) return;
    const ring = parseEncryptionKeyRing({ current: currentKey });
    const encrypted = encryptCredential({
      plaintext: Buffer.from(plaintext), credentialId, userId,
      provider: "gemini-direct", secretVersion: 1, keyRing: ring,
    });

    const decrypted = decryptCredential({
      encryptedSecret: encrypted, credentialId, userId,
      provider: "gemini-direct", secretVersion: 1, keyRing: ring,
    });

    expect(decrypted.toString("utf8")).toBe(plaintext);
  });

  it("uses unique random nonces across a meaningful sample", async () => {
    const { parseEncryptionKeyRing, encryptCredential } = await loadVault();
    if (!parseEncryptionKeyRing || !encryptCredential) return;
    const ring = parseEncryptionKeyRing({ current: currentKey });
    const nonces = new Set<string>();

    for (let index = 0; index < 512; index += 1) {
      nonces.add(encryptCredential({
        plaintext: Buffer.from(plaintext), credentialId, userId,
        provider: "gemini-direct", secretVersion: 1, keyRing: ring,
      }).nonce);
    }

    expect(nonces.size).toBe(512);
  });

  it.each([
    ["modified ciphertext", (secret: EncryptedSecret) => ({
      ...secret, ciphertext: flipEncodedByte(secret.ciphertext),
    })],
    ["modified authentication tag", (secret: EncryptedSecret) => ({
      ...secret, authTag: flipEncodedByte(secret.authTag),
    })],
  ])("normalizes %s failures", async (_label, mutate) => {
    const { parseEncryptionKeyRing, encryptCredential, decryptCredential } =
      await loadVault();
    if (!parseEncryptionKeyRing || !encryptCredential || !decryptCredential) return;
    const ring = parseEncryptionKeyRing({ current: currentKey });
    const encrypted = encryptCredential({
      plaintext: Buffer.from(plaintext), credentialId, userId,
      provider: "gemini-direct", secretVersion: 1, keyRing: ring,
    });

    expect(() => decryptCredential({
      encryptedSecret: mutate(encrypted), credentialId, userId,
      provider: "gemini-direct", secretVersion: 1, keyRing: ring,
    })).toThrow("The saved credential cannot be decrypted.");
  });

  it.each([
    ["wrong key", { ring: replacementKey, credentialId, userId, provider: "gemini-direct", secretVersion: 1 }],
    ["swapped credential ID", { ring: currentKey, credentialId: "64c64c64c64c64c64c64c64c", userId, provider: "gemini-direct", secretVersion: 1 }],
    ["swapped owner", { ring: currentKey, credentialId, userId: "64d64d64d64d64d64d64d64d", provider: "gemini-direct", secretVersion: 1 }],
    ["swapped provider", { ring: currentKey, credentialId, userId, provider: "openai-direct", secretVersion: 1 }],
    ["swapped secret version", { ring: currentKey, credentialId, userId, provider: "gemini-direct", secretVersion: 2 }],
    ["swapped key version", { ring: `v8:${currentKeyBytes.toString("base64url")}`, credentialId, userId, provider: "gemini-direct", secretVersion: 1, keyVersion: 8 }],
  ])("rejects a %s", async (_label, changed) => {
    const { parseEncryptionKeyRing, encryptCredential, decryptCredential } =
      await loadVault();
    if (!parseEncryptionKeyRing || !encryptCredential || !decryptCredential) return;
    const sourceRing = parseEncryptionKeyRing({ current: currentKey });
    const encrypted = encryptCredential({
      plaintext: Buffer.from(plaintext), credentialId, userId,
      provider: "gemini-direct", secretVersion: 1, keyRing: sourceRing,
    });
    const changedSecret = "keyVersion" in changed
      ? { ...encrypted, keyVersion: changed.keyVersion }
      : encrypted;

    expect(() => decryptCredential({
      encryptedSecret: changedSecret,
      credentialId: changed.credentialId,
      userId: changed.userId,
      provider: changed.provider,
      secretVersion: changed.secretVersion,
      keyRing: parseEncryptionKeyRing({ current: changed.ring }),
    })).toThrow("The saved credential cannot be decrypted.");
  });

  it("re-encrypts plaintext under the current key without changing the secret version", async () => {
    const {
      parseEncryptionKeyRing, encryptCredential, decryptCredential,
      reencryptCredential,
    } = await loadVault();
    expect(reencryptCredential).toBeTypeOf("function");
    if (!parseEncryptionKeyRing || !encryptCredential || !decryptCredential || !reencryptCredential) return;
    const sourceRing = parseEncryptionKeyRing({ current: currentKey });
    const targetRing = parseEncryptionKeyRing({
      current: replacementKey,
      previous: currentKey,
    });
    const original = encryptCredential({
      plaintext: Buffer.from(plaintext), credentialId, userId,
      provider: "gemini-direct", secretVersion: 3, keyRing: sourceRing,
    });

    const rotated = reencryptCredential({
      encryptedSecret: original, credentialId, userId,
      provider: "gemini-direct", secretVersion: 3,
      sourceKeyRing: sourceRing, targetKeyRing: targetRing,
    });

    expect(rotated.keyVersion).toBe(8);
    expect(rotated.ciphertext).not.toBe(original.ciphertext);
    expect(decryptCredential({
      encryptedSecret: rotated, credentialId, userId,
      provider: "gemini-direct", secretVersion: 3, keyRing: targetRing,
    }).toString("utf8")).toBe(plaintext);
  });

  it("keeps normalized decryption errors free of cryptographic material", async () => {
    const { parseEncryptionKeyRing, encryptCredential, decryptCredential } =
      await loadVault();
    if (!parseEncryptionKeyRing || !encryptCredential || !decryptCredential) return;
    const sourceRing = parseEncryptionKeyRing({ current: currentKey });
    const encrypted = encryptCredential({
      plaintext: Buffer.from(plaintext), credentialId, userId,
      provider: "gemini-direct", secretVersion: 1, keyRing: sourceRing,
    });

    let captured: unknown;
    try {
      decryptCredential({
        encryptedSecret: encrypted, credentialId, userId,
        provider: "gemini-direct", secretVersion: 1,
        keyRing: parseEncryptionKeyRing({ current: replacementKey }),
      });
    } catch (error) {
      captured = error;
    }

    const serialized = JSON.stringify(captured, Object.getOwnPropertyNames(captured));
    expect(serialized).not.toContain(plaintext);
    expect(serialized).not.toContain(encrypted.ciphertext);
    expect(serialized).not.toContain(encrypted.nonce);
    expect(serialized).not.toContain(encrypted.authTag);
    expect(serialized).not.toContain(currentKeyBytes.toString("base64url"));
  });

  it("masks only a bounded suffix and clears mutable buffers", async () => {
    const { maskCredentialSuffix, clearSecretBuffer } = await loadVault();
    expect(maskCredentialSuffix).toBeTypeOf("function");
    expect(clearSecretBuffer).toBeTypeOf("function");
    if (!maskCredentialSuffix || !clearSecretBuffer) return;
    const mutable = Buffer.from(plaintext);

    const masked = maskCredentialSuffix(plaintext);
    clearSecretBuffer(mutable);

    expect(masked).toBe("••••-key");
    expect(masked).not.toContain(plaintext);
    expect([...mutable]).toEqual(Array(mutable.length).fill(0));
  });
});
