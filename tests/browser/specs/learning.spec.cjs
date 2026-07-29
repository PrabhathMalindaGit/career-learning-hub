const path = require("node:path");
const { expect, test } = require("../support/fixtures.cjs");

test("@smoke covers private PDF, chat, Flashcards, and Quiz secrecy", async ({
  page,
  phase14,
}) => {
  const user = await phase14.createUser("learning");
  await phase14.login(page, user);
  await phase14.navigate(page, "Learning");
  await expect(
    page.getByRole("heading", { name: "No documents yet" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Upload PDF" }).click();
  await page.getByRole("button", { name: "Upload document" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Review the highlighted fields",
  );

  const title = phase14.title("Learning");
  await page.getByRole("textbox", { name: "Document title" }).fill(title);
  await page.getByLabel("PDF file").setInputFiles(
    path.resolve(__dirname, "../fixtures/synthetic-learning.pdf"),
  );
  await page.getByRole("button", { name: "Upload document" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  const records = await phase14.promoteLearningDocument(user, title);
  await phase14.navigate(page, "Dashboard");
  await phase14.navigate(page, "Learning");
  await page.getByRole("link", { name: "Open workspace" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const breadcrumbs = page.getByRole("navigation", {
    name: "Breadcrumb",
  });
  await expect(breadcrumbs).toContainText(title);
  await expect(breadcrumbs).not.toContainText(records.documentId);
  await page.getByRole("tab", { name: "Original PDF" }).click();
  await expect(page.getByTitle(`Original PDF: ${title}`)).toHaveAttribute(
    "src",
    /^blob:/,
  );

  await page.getByRole("tab", { name: "Grounded Chat" }).click();
  await page
    .getByRole("link", { name: /Phase 14 grounded chat/ })
    .click();
  await expect(page.getByText("Stored synthetic answer")).toBeVisible();
  await page.getByRole("textbox", { name: "Question" }).fill(
    "What is the provider-free state?",
  );
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("status")).toContainText(/queued|paused/i);

  await phase14.openRoute(
    page,
    `/learning/documents/${records.documentId}/flashcards/${records.flashcardSetId}`,
  );
  await expect(
    page.getByRole("heading", { name: "Phase 14 flashcards" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await expect(page.getByText("Stored synthetic back")).toBeVisible();
  await page.getByRole("button", { name: "Next flashcard" }).click();

  await phase14.openRoute(
    page,
    `/learning/documents/${records.documentId}/quizzes/${records.quizId}`,
  );
  await expect(page.getByText("Which state is safe?")).toBeVisible();
  await expect(page.getByText("Stored explanation")).toHaveCount(0);
  await expect(page.getByText(/correct answer/i)).toHaveCount(0);
  await page.getByRole("radio", { name: "Unavailable without disclosure" })
    .check();
  await page.getByRole("button", { name: "Submit quiz answers" }).click();
  await expect(page).toHaveURL(/\/attempts\//);
  await expect(page.getByText("Stored explanation")).toBeVisible();
  await phase14.expectPageHealth(page);
});
