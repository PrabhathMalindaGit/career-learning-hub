import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { registerTestUser } from "../helpers/auth.js";

describe("cross-user access denial integration", () => {
  it("prevents another user from reading a resume and version", async () => {
    const owner = await registerTestUser(app, {
      email: "resume-owner@example.com",
      displayName: "Resume Owner",
    });
    const attacker = await registerTestUser(app, {
      email: "resume-attacker@example.com",
      displayName: "Resume Attacker",
    });

    const created = await request(app)
      .post("/api/v1/resumes")
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        title: "Private Resume",
      })
      .expect(201);

    const resumeId = created.body.data.resume._id;
    const versionId = created.body.data.version._id;

    const resumeResponse = await request(app)
      .get(`/api/v1/resumes/${resumeId}`)
      .set(
        "Authorization",
        `Bearer ${attacker.accessToken}`,
      )
      .expect(404);

    expect(resumeResponse.body.error.code).toBe(
      "RESUME_NOT_FOUND",
    );

    const versionResponse = await request(app)
      .get(
        `/api/v1/resumes/${resumeId}/versions/${versionId}`,
      )
      .set(
        "Authorization",
        `Bearer ${attacker.accessToken}`,
      )
      .expect(404);

    expect(versionResponse.body.error.code).toBe(
      "RESUME_VERSION_NOT_FOUND",
    );
  });
});
