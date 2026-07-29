const { expect, test } = require("../support/fixtures.cjs");

async function installLayoutShiftCollector(page) {
  await page.addInitScript(() => {
    window.__phase16fAuthBootstrapCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__phase16fAuthBootstrapCls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
}

test("keeps the authentication bootstrap layout stable", async ({
  page,
  phase14,
}, testInfo) => {
  await installLayoutShiftCollector(page);
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );

  const cls = await page.evaluate(
    () => window.__phase16fAuthBootstrapCls,
  );
  console.log(
    `Phase 16F auth bootstrap CLS (${testInfo.project.name}): ${cls.toFixed(4)}`,
  );
  expect(cls).toBeLessThanOrEqual(0.1);
  await phase14.expectPageHealth(page);
});

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

test("preserves responsive auth destinations and keyboard foundations", async ({
  page,
  phase14,
}) => {
  const user = await phase14.createUser("auth-responsive");
  await phase14.login(page, user);
  await page.goto("/dashboard");

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 720 },
    { width: 720, height: 450 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(
      page.getByRole("heading", { name: "Unified dashboard" }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toHaveCount(1);
    await phase14.expectPageHealth(page);

    await page.evaluate(() => {
      document.body.tabIndex = -1;
      document.body.focus();
      document.body.removeAttribute("tabindex");
    });
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", {
      name: "Skip to main content",
    });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  const transitionDurationSeconds = await page
    .getByRole("link", { name: "Skip to main content" })
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration),
    );
  expect(transitionDurationSeconds).toBeLessThanOrEqual(0.001);
});
