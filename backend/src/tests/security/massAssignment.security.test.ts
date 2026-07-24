import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import {
  registerTestUser,
  TEST_PASSWORD,
} from "../helpers/auth.js";

describe("mass-assignment protections", () => {
  it("rejects privileged fields during registration", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "mass-register@example.com",
        password: TEST_PASSWORD,
        displayName: "Mass Register",
        roles: ["admin"],
        accountStatus: "active",
      })
      .expect(400);

    expect(response.body.error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("rejects account status and roles in profile updates", async () => {
    const user = await registerTestUser(app, {
      email: "mass-profile@example.com",
      displayName: "Mass Profile",
    });

    const response = await request(app)
      .patch("/api/v1/users/me")
      .set(
        "Authorization",
        `Bearer ${user.accessToken}`,
      )
      .send({
        displayName: "Changed Name",
        roles: ["admin"],
        accountStatus: "suspended",
      })
      .expect(400);

    expect(response.body.error.code).toBe(
      "VALIDATION_ERROR",
    );

    const current = await request(app)
      .get("/api/v1/users/me")
      .set(
        "Authorization",
        `Bearer ${user.accessToken}`,
      )
      .expect(200);

    expect(current.body.data.user.roles).toEqual(["user"]);
    expect(current.body.data.user.accountStatus).toBe(
      "active",
    );
    expect(current.body.data.user.profile.displayName).toBe(
      "Mass Profile",
    );
  });
});
