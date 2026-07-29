const { expect, test } = require("../support/fixtures.cjs");

test("@smoke creates and practices in an Interview session", async ({
  page,
  phase14,
}) => {
  const user = await phase14.createUser("interview");
  await phase14.login(page, user);
  await phase14.navigate(page, "Interviews");
  await expect(page.getByText(/No interview sessions/)).toBeVisible();

  await page.getByRole("button", { name: "Create session" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Review the highlighted fields",
  );

  const title = phase14.title("Interview");
  await page.getByRole("textbox", { name: "Session title" }).fill(title);
  await page.getByRole("textbox", { name: "Target role" }).fill(
    "Platform Engineer",
  );
  await page.getByRole("textbox", { name: "Experience level" }).fill(
    "Senior",
  );
  await page.getByRole("button", { name: "Create session" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const breadcrumbs = page.getByRole("navigation", {
    name: "Breadcrumb",
  });
  await expect(breadcrumbs).toContainText(title);
  await expect(breadcrumbs).not.toContainText(/507f[0-9a-f]+/i);

  const ordinaryControls = [
    page.getByLabel("Question count"),
    page.getByLabel("Categories"),
    page.getByLabel("Difficulty").first(),
    page.getByLabel("Category"),
    page.getByLabel("Attempt status"),
  ];
  for (const control of ordinaryControls) {
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
  }

  await page.getByRole("button", { name: "Add manually" }).click();
  const manualForm = page.locator("#manual-question-form");
  await manualForm.getByLabel("Category", { exact: true }).fill(
    "Systems",
  );
  await manualForm.getByLabel("Difficulty").selectOption("medium");
  await manualForm.getByLabel("Question", { exact: true }).fill(
    "How do you keep a distributed system observable?",
  );
  await manualForm.getByRole("button", { name: "Add question" }).click();
  await expect(
    page.getByRole("button", {
      name: "How do you keep a distributed system observable?",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Pin question" }).click();
  await page.getByLabel("Private notes").fill(
    "Discuss traces, metrics, and structured logs.",
  );
  await page.getByRole("button", { name: "Save notes" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Notes saved" }),
  ).toHaveText("Notes saved.");
  await page.getByLabel("Written answer").fill(
    "Use correlated traces, service metrics, and redacted structured logs.",
  );
  await page
    .getByRole("button", { name: "Record immutable attempt" })
    .click();
  await expect(page.getByText("Recorded answer")).toBeVisible();

  await page.getByRole("button", { name: "Generate questions" }).click();
  await expect(
    page.getByRole("region", { name: "Provider job status" }),
  ).toBeVisible();
  await phase14.expectPageHealth(page);
});
