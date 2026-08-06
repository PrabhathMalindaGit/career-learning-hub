import { describe, expect, it } from "vitest";
import { sanitizeForLog } from "../../shared/logger.js";

describe("structured log redaction", () => {
  it("redacts secrets and highly personal resume fields", () => {
    const sanitized = sanitizeForLog({
      authorization: "Bearer secret-token",
      "x-goog-api-key": "AIzaLoggerCanaryCredential-123456789",
      password: "Password123",
      resumeContent: {
        basics: {
          email: "candidate@example.com",
          phone: "+94 77 123 4567",
        },
        experience: [
          {
            employer: "Private Employer",
          },
        ],
      },
      message:
        "Contact candidate@example.com with eyJabcdefghijk.abcdefghijk.abcdefghijk",
    }) as Record<string, unknown>;

    expect(sanitized.authorization).toBe("[REDACTED]");
    expect(sanitized["x-goog-api-key"]).toBe("[REDACTED]");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.resumeContent).toBe("[REDACTED]");
    expect(String(sanitized.message)).not.toContain(
      "candidate@example.com",
    );
    expect(String(sanitized.message)).not.toContain(
      "eyJabcdefghijk",
    );
  });
});
