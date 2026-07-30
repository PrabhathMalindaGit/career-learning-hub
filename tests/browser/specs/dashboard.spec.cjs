const { expect, test } = require("../support/fixtures.cjs");

async function tabTo(page, target) {
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
    document.body.removeAttribute("tabindex");
  });

  for (let index = 0; index < 30; index += 1) {
    await page.keyboard.press("Tab");
    if (
      await target.evaluate(
        (element) => element === document.activeElement,
      )
    ) {
      return;
    }
  }

  throw new Error("Keyboard traversal did not reach the target.");
}

test("@smoke covers empty and populated Dashboard states with paging", async ({
  page,
  phase14,
}) => {
  const user = await phase14.createUser("dashboard");
  await phase14.login(page, user);

  const viewport = page.viewportSize();
  if (viewport && viewport.width > 980) {
    await expect(page.locator(".app-sidebar")).toBeVisible();
    await expect(page.locator(".app-header")).toBeHidden();
    await page.locator(".app-sidebar summary").click();
    await expect(
      page
        .locator(".app-sidebar")
        .getByRole("link", { name: "Resume", exact: true }),
    ).toHaveAttribute("href", "/resumes?action=create");
    await expect(
      page.locator(".app-sidebar").getByRole("link", {
        name: "Interview session",
      }),
    ).toHaveAttribute("href", "/interviews?action=create");
    await expect(
      page.locator(".app-sidebar").getByRole("link", {
        name: "Learning document",
      }),
    ).toHaveAttribute("href", "/learning?action=upload");
  } else {
    const toggle = page.getByRole("button", {
      name: "Toggle navigation",
    });
    await toggle.click();
    const drawer = page.getByRole("dialog", { name: "Navigation" });
    await expect(drawer).toBeVisible();
    await expect(
      drawer.getByRole("button", { name: "Close navigation" }),
    ).toBeFocused();
    await drawer.getByRole("button", { name: "Close navigation" }).click();
    await expect(toggle).toBeFocused();
  }

  await expect(
    page.getByRole("heading", { name: "Unified dashboard" }),
  ).toBeVisible();

  const quickStart = page.getByRole("navigation", {
    name: "Quick start",
  });
  const quickStartLinks = quickStart.getByRole("link");
  await expect(quickStartLinks).toHaveCount(3);
  await expect(
    quickStart.getByRole("link", { name: /Create Resume/ }),
  ).toHaveAttribute("href", "/resumes?action=create");
  await expect(
    quickStart.getByRole("link", {
      name: /Start Interview Session/,
    }),
  ).toHaveAttribute("href", "/interviews?action=create");
  await expect(
    quickStart.getByRole("link", {
      name: /Upload Learning Document/,
    }),
  ).toHaveAttribute("href", "/learning?action=upload");

  await tabTo(page, quickStartLinks.nth(0));
  await expect(quickStartLinks.nth(0)).toBeFocused();
  const focusOutlineWidth = await quickStartLinks
    .nth(0)
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).outlineWidth),
    );
  expect(focusOutlineWidth).toBeGreaterThan(0);
  await page.keyboard.press("Tab");
  await expect(quickStartLinks.nth(1)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(quickStartLinks.nth(2)).toBeFocused();

  await expect(page.getByText("No recorded dashboard data")).toBeVisible();

  await phase14.seedDashboard(user);
  await page.reload();
  await expect(page.getByText("Quiz completed").first()).toBeVisible();
  await page.getByRole("button", { name: "7 days" }).click();
  await expect(
    page.getByRole("button", { name: "7 days" }),
  ).toHaveAttribute("aria-pressed", "true");

  const activity = page.getByRole("region", {
    name: "Dashboard activity",
  });
  await activity
    .getByRole("button", { name: "Next activity page" })
    .click();
  await expect(activity.getByText("Page 2 of 3")).toBeVisible();
  await phase14.navigate(page, "Resumes");
  await expect(
    page.getByRole("heading", { name: "Resume Studio" }),
  ).toBeVisible();
  await phase14.expectPageHealth(page);
});
