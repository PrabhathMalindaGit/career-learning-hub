import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../../middleware/rateLimit.js";
import { requestContextMiddleware } from "../../middleware/requestContext.js";

describe("rate-limit bypass resistance", () => {
  it("does not trust spoofed X-Forwarded-For values when no proxy is configured", async () => {
    const isolatedApp = express();
    isolatedApp.set("trust proxy", false);
    isolatedApp.use(requestContextMiddleware);
    isolatedApp.use(
      createRateLimiter({
        windowMs: 60_000,
        limit: 2,
        identifier: "security-test",
      }),
    );
    isolatedApp.get("/limited", (_request, response) => {
      response.status(200).json({ success: true });
    });

    await request(isolatedApp)
      .get("/limited")
      .set("X-Forwarded-For", "198.51.100.10")
      .expect(200);

    await request(isolatedApp)
      .get("/limited")
      .set("X-Forwarded-For", "198.51.100.11")
      .expect(200);

    const blocked = await request(isolatedApp)
      .get("/limited")
      .set("X-Forwarded-For", "198.51.100.12")
      .expect(429);

    expect(blocked.body.error).toMatchObject({
      code: "RATE_LIMIT_EXCEEDED",
      limiter: "security-test",
    });
  });
});
