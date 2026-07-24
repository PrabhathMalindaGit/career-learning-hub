import type { Express } from "express";
import request from "supertest";

export const TEST_PASSWORD = "CorrectHorse1Battery";

export async function registerTestUser(
  app: Express,
  input: {
    email: string;
    displayName: string;
    password?: string;
  },
): Promise<{
  accessToken: string;
  userId: string;
}> {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({
      email: input.email,
      password: input.password ?? TEST_PASSWORD,
      displayName: input.displayName,
    })
    .expect(201);

  return {
    accessToken: response.body.data.accessToken,
    userId: response.body.data.user.id,
  };
}
