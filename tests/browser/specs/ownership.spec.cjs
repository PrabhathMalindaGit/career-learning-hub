const { expect, test } = require("../support/fixtures.cjs");

test("@smoke denies User B across all User A owned-resource routes", async ({
  page,
  phase14,
}) => {
  const userA = await phase14.createUser("owner-a");
  const userB = await phase14.createUser("owner-b");
  const resources = await phase14.seedOwnershipResources(userA);
  await phase14.login(page, userB);

  const routes = [
    `/interviews/${resources.interviewSessionId}`,
    `/learning/documents/${resources.documentId}`,
    `/learning/documents/${resources.documentId}/conversations/${resources.conversationId}`,
    `/learning/documents/${resources.documentId}/flashcards/${resources.flashcardSetId}`,
    `/learning/documents/${resources.documentId}/quizzes/${resources.quizId}`,
    `/learning/documents/${resources.documentId}/quizzes/${resources.quizId}/attempts/${resources.quizAttemptId}`,
    `/resumes/${resources.resumeId}`,
  ];

  for (const [index, route] of routes.entries()) {
    if (index === 0) {
      await page.goto(route);
    } else {
      await phase14.openRoute(page, route);
    }
    await expect(
      page.getByRole("heading", {
        name: /unavailable|not found|could not be opened/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(resources.privateTitle)).toHaveCount(0);
    await expect(page.getByText(resources.privateContent)).toHaveCount(0);
    await phase14.expectPageHealth(page);
  }
});
