const { mkdir, rm } = require("node:fs/promises");
const { expect, test } = require("../support/fixtures.cjs");

const reviewRoot = "/private/tmp/career-learning-hub-ui-d1-review";

async function resetScreenshotView(page) {
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
}

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
}, testInfo) => {
  if (testInfo.project.name === "desktop") {
    await rm(reviewRoot, { recursive: true, force: true });
    await mkdir(reviewRoot, { recursive: true });
  }

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
  await expect(
    page.getByText(
      "Career Learning Hub · Open Book + Rising Pathway",
    ),
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

  for (const [index, destination] of [
    "/resumes?action=create",
    "/interviews?action=create",
    "/learning?action=upload",
  ].entries()) {
    await quickStartLinks.nth(index).focus();
    await Promise.all([
      page.waitForURL(
        (url) => `${url.pathname}${url.search}` === destination,
      ),
      page.keyboard.press("Enter"),
    ]);
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard$/);
  }

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
  await expect(
    page.getByRole("meter", {
      name: /Resume readiness: \d+ out of 100/,
    }),
  ).toBeVisible();
  await expect(page.getByText("Keyword match")).toBeVisible();
  await expect(page.getByText(/continue work/i)).toHaveCount(0);
  await expect(
    page.locator(".dashboard-activity-item").last(),
  ).toHaveCSS("opacity", "1");

  if (testInfo.project.name === "desktop") {
    await resetScreenshotView(page);
    await page.screenshot({
      path: `${reviewRoot}/legacy-port-dashboard-overview-desktop.png`,
      fullPage: true,
    });
    await page.locator(".dashboard-progress-composition").screenshot({
      path: `${reviewRoot}/legacy-port-dashboard-metrics.png`,
    });
    await page.getByRole("main").screenshot({
      path: `${reviewRoot}/legacy-port-dashboard-modules-activity.png`,
    });

    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 1024, height: 768 },
    ]) {
      await page.setViewportSize(viewport);
      const overflowingElements = await page.evaluate(() => {
        const viewportWidth =
          document.documentElement.clientWidth;
        return Array.from(document.querySelectorAll("*"))
          .map((element) => {
            const bounds = element.getBoundingClientRect();
            return {
              selector: [
                element.tagName.toLowerCase(),
                ...Array.from(element.classList).slice(0, 2),
              ].join("."),
              left: Math.round(bounds.left),
              right: Math.round(bounds.right),
              width: Math.round(bounds.width),
            };
          })
          .filter(
            ({ left, right }) =>
              left < -1 || right > viewportWidth + 1,
          )
          .slice(0, 12);
      });
      expect(
        overflowingElements,
        `Overflowing elements at ${viewport.width}x${viewport.height}`,
      ).toEqual([]);
      await phase14.expectPageHealth(page);
    }

    await page.setViewportSize({ width: 512, height: 384 });
    await phase14.expectPageHealth(page);
    await resetScreenshotView(page);
    await page.screenshot({
      path: `${reviewRoot}/legacy-port-dashboard-native-200-percent.png`,
      fullPage: true,
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".dashboard-trend-row").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  if (testInfo.project.name === "mobile") {
    await resetScreenshotView(page);
    await page.screenshot({
      path: `${reviewRoot}/legacy-port-dashboard-mobile.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 720 });
    await phase14.expectPageHealth(page);
    await page.setViewportSize({ width: 390, height: 844 });
  }

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

test("covers truthful partial Dashboard module data", async ({
  page,
  phase14,
}) => {
  const user = await phase14.createUser("dashboard-partial");
  await phase14.login(page, user);
  const resources = await phase14.seedOwnershipResources(user);
  await page.reload();

  await expect(page.getByText("No Resume analysis yet")).toBeVisible();
  await expect(page.getByText("No Interview activity yet")).toBeVisible();
  await expect(page.getByText(resources.privateTitle)).toBeVisible();
  await expect(page.getByText("No AI usage yet")).toBeVisible();
  await phase14.expectPageHealth(page);
});

test("covers Dashboard loading, failure, request ID, and retry", async ({
  page,
  phase14,
}, testInfo) => {
  const user = await phase14.createUser("dashboard-failure");
  let releaseProgress;
  let failureEnabled = true;
  const progressGate = new Promise((resolve) => {
    releaseProgress = resolve;
  });

  await page.route("**/dashboard/progress?*", async (route) => {
    await progressGate;
    if (!failureEnabled) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "DASHBOARD_UNAVAILABLE",
          message: "Dashboard data is temporarily unavailable.",
          requestId: "dashboard-browser-request-1",
        },
      }),
    });
  });

  await phase14.login(page, user);
  await expect(
    page.getByRole("status", { name: "Loading progress" }),
  ).toBeVisible();
  releaseProgress();
  await expect(
    page.getByText("Dashboard data is temporarily unavailable."),
  ).toBeVisible();
  await expect(
    page.getByText("Request ID: dashboard-browser-request-1"),
  ).toBeVisible();

  if (testInfo.project.name === "desktop") {
    await page.screenshot({
      path: `${reviewRoot}/legacy-port-dashboard-loading-empty-error.png`,
      fullPage: true,
    });
  }

  failureEnabled = false;
  await page.getByRole("button", { name: "Retry progress" }).click();
  await expect(page.getByText("No recorded dashboard data")).toBeVisible();
  await phase14.expectPageHealth(page);
});
