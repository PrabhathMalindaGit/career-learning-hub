const { expect, test } = require("../support/fixtures.cjs");

test("@smoke validates registration, routing, reload persistence, and sign-out", async ({
  page,
  phase14,
}) => {
  await page.goto("/register");
  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Review the highlighted fields",
  );

  const identity = phase14.identity("registration");
  await page.getByRole("textbox", { name: "Display name" }).fill(
    identity.displayName,
  );
  await page.getByRole("textbox", { name: "Email address" }).fill(
    identity.email,
  );
  await page.getByLabel("Password").fill(identity.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await phase14.trackRegistered(identity.email);
  await expect(
    page.getByRole("heading", { name: "Unified dashboard" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Unified dashboard" }),
  ).toBeVisible();

  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Session settings" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sign out of this session" })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Review the highlighted fields",
  );
  await phase14.expectPageHealth(page);
});

test("signs in successfully and redirects an intended protected route", async ({
  page,
  phase14,
}) => {
  const user = await phase14.createUser("login");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);
  await phase14.fillLogin(page, user);
  await expect(page).toHaveURL(/\/settings$/);
  await expect(
    page
      .getByRole("region", { name: "Session settings" })
      .getByText(user.displayName),
  ).toBeVisible();
  await phase14.expectPageHealth(page);
});
