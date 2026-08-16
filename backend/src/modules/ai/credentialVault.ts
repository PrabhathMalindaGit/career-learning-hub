import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const AAD_VERSION = 1 as const;
const PLACEHOLDER_PATTERN = /replace|example|placeholder|changeme|todo/i;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export interface EncryptionKeyRing {
  currentVersion?: number;
  keys: ReadonlyMap<number, Buffer>;
}

export interface EncryptedCredentialSecret {
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: number;
  aadVersion: typeof AAD_VERSION;
}

interface CredentialBinding {
  credentialId: string;
  userId: string;
  provider: string;
  secretVersion: number;
}

interface EncryptCredentialInput extends CredentialBinding {
  plaintext: Buffer;
  keyRing: EncryptionKeyRing;
  nonceFactory?: (size: number) => Buffer;
}

interface DecryptCredentialInput extends CredentialBinding {
  encryptedSecret: EncryptedCredentialSecret;
  keyRing: EncryptionKeyRing;
}

export class CredentialVaultUnavailableError extends Error {
  readonly code = "provider_not_configured";

  constructor() {
    super("Credential storage is unavailable.");
    this.name = "CredentialVaultUnavailableError";
  }
}

export class CredentialDecryptionError extends Error {
  readonly code = "credential_decryption_failed";

  constructor() {
    super("The saved credential cannot be decrypted.");
    this.name = "CredentialDecryptionError";
  }
}

function invalidKeyConfiguration(): never {
  throw new Error("Invalid BYOK encryption key configuration.");
}

function decodeKeyEntry(entry: string): {
  version: number;
  key: Buffer;
} {
  if (PLACEHOLDER_PATTERN.test(entry)) invalidKeyConfiguration();

  const match = /^v([1-9]\d*):([A-Za-z0-9_-]+)$/.exec(entry);
  if (!match) invalidKeyConfiguration();

  const version = Number(match[1]);
  const encoded = match[2];
  if (!Number.isSafeInteger(version) || !BASE64URL_PATTERN.test(encoded)) {
    invalidKeyConfiguration();
  }

  const key = Buffer.from(encoded, "base64url");
  if (
    key.byteLength !== KEY_BYTES ||
    key.toString("base64url") !== encoded ||
    PLACEHOLDER_PATTERN.test(key.toString("utf8"))
  ) {
    key.fill(0);
    invalidKeyConfiguration();
  }

  return { version, key };
}

export function parseEncryptionKeyRing(input: {
  current?: string;
  previous?: string;
}): EncryptionKeyRing {
  const current = input.current?.trim();
  const previous = input.previous?.trim();

  if (!current && !previous) {
    return {
      currentVersion: undefined,
      keys: new Map(),
    };
  }
  if (!current) invalidKeyConfiguration();

  const currentEntry = decodeKeyEntry(current);
  const keys = new Map<number, Buffer>([
    [currentEntry.version, currentEntry.key],
  ]);

  if (previous) {
    const entries = previous.split(",").map((entry) => entry.trim());
    if (entries.some((entry) => entry.length === 0)) {
      invalidKeyConfiguration();
    }

    for (const entry of entries) {
      const decoded = decodeKeyEntry(entry);
      if (keys.has(decoded.version)) {
        decoded.key.fill(0);
        invalidKeyConfiguration();
      }
      keys.set(decoded.version, decoded.key);
    }
  }

  return {
    currentVersion: currentEntry.version,
    keys,
  };
}

function assertBinding(binding: CredentialBinding): void {
  if (
    !binding.credentialId ||
    !binding.userId ||
    !binding.provider ||
    binding.credentialId.includes("|") ||
    binding.userId.includes("|") ||
    binding.provider.includes("|") ||
    !Number.isSafeInteger(binding.secretVersion) ||
    binding.secretVersion < 1
  ) {
    throw new Error("Invalid credential encryption metadata.");
  }
}

function credentialAad(
  binding: CredentialBinding,
  keyVersion: number,
): Buffer {
  return Buffer.from(
    [
      "clh",
      "ai-credential",
      "aad-v1",
      binding.credentialId,
      binding.userId,
      binding.provider,
      binding.secretVersion,
      keyVersion,
    ].join("|"),
    "utf8",
  );
}

function strictBase64Url(value: string): Buffer {
  if (!value || !BASE64URL_PATTERN.test(value)) {
    throw new Error("Invalid encoded credential material.");
  }
  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    decoded.fill(0);
    throw new Error("Invalid encoded credential material.");
  }
  return decoded;
}

// Features 6.4, 6.7, and 6.9 — Personal Gemini credential vault.
// Encrypts/decrypts server-side credential material for controlled execution;
// the complete saved key is never returned to the browser.
export function encryptCredential(
  input: EncryptCredentialInput,
): EncryptedCredentialSecret {
  assertBinding(input);
  const keyVersion = input.keyRing.currentVersion;
  if (keyVersion === undefined) {
    throw new CredentialVaultUnavailableError();
  }
  const key = input.keyRing.keys.get(keyVersion);
  if (!key || key.byteLength !== KEY_BYTES) {
    throw new CredentialVaultUnavailableError();
  }
  if (!Buffer.isBuffer(input.plaintext) || input.plaintext.byteLength === 0) {
    throw new Error("A non-empty mutable credential buffer is required.");
  }

  const nonce = (input.nonceFactory ?? randomBytes)(NONCE_BYTES);
  if (!Buffer.isBuffer(nonce) || nonce.byteLength !== NONCE_BYTES) {
    throw new Error("Credential nonce generation failed.");
  }

  const cipher = createCipheriv("aes-256-gcm", key, nonce, {
    authTagLength: AUTH_TAG_BYTES,
  });
  cipher.setAAD(credentialAad(input, keyVersion));
  const ciphertext = Buffer.concat([
    cipher.update(input.plaintext),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64url"),
    nonce: nonce.toString("base64url"),
    authTag: authTag.toString("base64url"),
    keyVersion,
    aadVersion: AAD_VERSION,
  };
}

export function decryptCredential(
  input: DecryptCredentialInput,
): Buffer {
  let nonce: Buffer | undefined;
  let authTag: Buffer | undefined;
  let ciphertext: Buffer | undefined;

  try {
    assertBinding(input);
    if (input.encryptedSecret.aadVersion !== AAD_VERSION) {
      throw new Error("Unsupported credential AAD version.");
    }

    const key = input.keyRing.keys.get(input.encryptedSecret.keyVersion);
    if (!key || key.byteLength !== KEY_BYTES) {
      throw new Error("Credential key version is unavailable.");
    }

    nonce = strictBase64Url(input.encryptedSecret.nonce);
    authTag = strictBase64Url(input.encryptedSecret.authTag);
    ciphertext = strictBase64Url(input.encryptedSecret.ciphertext);
    if (
      nonce.byteLength !== NONCE_BYTES ||
      authTag.byteLength !== AUTH_TAG_BYTES
    ) {
      throw new Error("Invalid credential encryption material.");
    }

    const decipher = createDecipheriv("aes-256-gcm", key, nonce, {
      authTagLength: AUTH_TAG_BYTES,
    });
    decipher.setAAD(
      credentialAad(input, input.encryptedSecret.keyVersion),
    );
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
  } catch {
    throw new CredentialDecryptionError();
  } finally {
    nonce?.fill(0);
    authTag?.fill(0);
    ciphertext?.fill(0);
  }
}

export function reencryptCredential(input: {
  encryptedSecret: EncryptedCredentialSecret;
  credentialId: string;
  userId: string;
  provider: string;
  secretVersion: number;
  sourceKeyRing: EncryptionKeyRing;
  targetKeyRing: EncryptionKeyRing;
  nonceFactory?: (size: number) => Buffer;
}): EncryptedCredentialSecret {
  const plaintext = decryptCredential({
    encryptedSecret: input.encryptedSecret,
    credentialId: input.credentialId,
    userId: input.userId,
    provider: input.provider,
    secretVersion: input.secretVersion,
    keyRing: input.sourceKeyRing,
  });

  try {
    return encryptCredential({
      plaintext,
      credentialId: input.credentialId,
      userId: input.userId,
      provider: input.provider,
      secretVersion: input.secretVersion,
      keyRing: input.targetKeyRing,
      nonceFactory: input.nonceFactory,
    });
  } finally {
    clearSecretBuffer(plaintext);
  }
}

export function maskCredentialSuffix(secret: string): string {
  const suffix = secret.slice(-4);
  return suffix ? `••••${suffix}` : "••••";
}

export function clearSecretBuffer(secret: Buffer): void {
  secret.fill(0);
}
