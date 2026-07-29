const { expect, test } = require("../support/fixtures.cjs");

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
