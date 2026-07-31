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

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.document).toBeLessThanOrEqual(1);
}

async function expectAuthStorageEmpty(page) {
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  expect(storage).toEqual({ local: [], session: [] });
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

test("renders the factual premium authentication shell across the review matrix", async ({
  page,
  phase14,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "The complete viewport matrix runs once in the desktop project.",
  );
  const externalRequests = [];
  const artworkResponses = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.origin !== "http://127.0.0.1:4173" &&
      url.origin !== "http://127.0.0.1:8000"
    ) {
      externalRequests.push(request.url());
    }
  });
  page.on("response", (response) => {
    if (
      new URL(response.url()).pathname ===
      "/brand/career-learning-hub-authentication-pathway.png"
    ) {
      artworkResponses.push(response.status());
    }
  });

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 720 },
    { width: 720, height: 450 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    const overview = page.getByRole("complementary", {
      name: "Career Learning Hub platform overview",
    });
    await expect(overview).toBeAttached();
    await expect(overview.getByText("Resume Studio")).toBeAttached();
    await expect(overview.getByText("Interview Coach")).toBeAttached();
    await expect(overview.getByText("Learning Workspace")).toBeAttached();
    await expect(
      overview.getByText("One Dashboard", { exact: true }),
    ).toBeAttached();
    const panelBox = await overview.boundingBox();
    expect(panelBox).not.toBeNull();
    for (const card of await overview
      .locator(".authentication-feature-card")
      .all()) {
      await expect(card).toBeVisible();
      const cardBox = await card.boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox.y).toBeGreaterThanOrEqual(panelBox.y);
      expect(cardBox.y + cardBox.height).toBeLessThanOrEqual(
        panelBox.y + panelBox.height + 1,
      );
    }
    const artwork = page.locator("[data-authentication-artwork]");
    const artworkImage = artwork.locator("img");
    await expect(artwork).toHaveAttribute("aria-hidden", "true");
    await expect(artworkImage).toHaveAttribute(
      "src",
      "/brand/career-learning-hub-authentication-pathway.png",
    );
    await expect(artworkImage).toHaveAttribute("alt", "");
    await expect(artwork.locator("svg")).toHaveCount(0);
    if (viewport.width > 620) {
      await expect(artworkImage).toBeVisible();
      await page.waitForTimeout(750);
      const artworkOpacity = await artwork.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).opacity),
      );
      if (viewport.width <= 900) {
        expect(artworkOpacity).toBeGreaterThanOrEqual(0.7);
        expect(artworkOpacity).toBeLessThanOrEqual(0.85);
      } else {
        expect(artworkOpacity).toBeGreaterThanOrEqual(0.9);
      }
      const [artworkBox, copyBox, cardsBox] = await Promise.all([
        artwork.boundingBox(),
        overview
          .locator(".authentication-brand-panel__copy")
          .boundingBox(),
        overview
          .locator(".authentication-feature-list")
          .boundingBox(),
      ]);
      expect(artworkBox).not.toBeNull();
      expect(copyBox).not.toBeNull();
      expect(cardsBox).not.toBeNull();
      expect(artworkBox.x).toBeGreaterThanOrEqual(panelBox.x - 1);
      expect(artworkBox.x + artworkBox.width).toBeLessThanOrEqual(
        panelBox.x + panelBox.width + 1,
      );
      expect(artworkBox.y).toBeGreaterThanOrEqual(
        copyBox.y + copyBox.height - 1,
      );
      expect(artworkBox.y + artworkBox.height).toBeLessThanOrEqual(
        cardsBox.y + 1,
      );
    } else {
      await expect(artworkImage).toBeHidden();
    }
    await expect(
      page.getByRole("button", { name: /continue with/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /forgot|reset password/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("checkbox", { name: /remember/i }),
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    if (viewport.width >= 1024) {
      const verticalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollHeight -
          document.documentElement.clientHeight,
      );
      expect(verticalOverflow).toBeLessThanOrEqual(1);
    }
    await phase14.expectPageHealth(page);
  }

  expect(externalRequests).toEqual([]);
  expect(artworkResponses).toContain(200);
  expect(artworkResponses.filter((status) => status >= 400)).toEqual([]);
});

test("preserves bootstrap geometry and reduced-motion behavior", async ({
  page,
  phase14,
}) => {
  await installLayoutShiftCollector(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  let releaseRefresh;
  const refreshGate = new Promise((resolve) => {
    releaseRefresh = resolve;
  });
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await refreshGate;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "REFRESH_TOKEN_REQUIRED",
          message: "A refresh token is required.",
          requestId: "auth-bootstrap-browser-request",
        },
      }),
    });
  });

  await page.goto("/login");
  const status = page.getByRole("status", {
    name: "Restoring your session",
  });
  await expect(status).toBeVisible();
  const bootstrapFrame = await page
    .locator(".authentication-shell__frame")
    .boundingBox();
  expect(bootstrapFrame).not.toBeNull();

  releaseRefresh();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  const finalFrame = await page
    .locator(".authentication-shell__frame")
    .boundingBox();
  expect(finalFrame).not.toBeNull();
  expect(Math.abs(finalFrame.width - bootstrapFrame.width)).toBeLessThanOrEqual(
    1,
  );
  expect(
    await page
      .locator(".authentication-form-card")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  expect(await page.evaluate(() => window.__phase16fAuthBootstrapCls))
    .toBeLessThanOrEqual(0.1);
  await page.unroute("**/api/v1/auth/refresh");
  await phase14.expectPageHealth(page);
});

test("keeps login keyboard order, Enter submission, and browser storage safe", async ({
  page,
  phase14,
}) => {
  const user = await phase14.createUser("auth-keyboard");
  await page.goto("/register");
  const displayName = page.getByRole("textbox", {
    name: "Display name",
  });
  const registrationEmail = page.getByRole("textbox", {
    name: "Email address",
  });
  const registrationPassword = page.getByLabel("Password");
  const registrationSubmit = page.getByRole("button", {
    name: "Create account",
  });
  await tabTo(page, displayName);
  await expect(displayName).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(registrationEmail).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(registrationPassword).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(registrationSubmit).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(registrationPassword).toBeFocused();

  await page.goto("/login");
  const email = page.getByRole("textbox", { name: "Email address" });
  const password = page.getByLabel("Password");
  const submit = page.getByRole("button", { name: "Sign in" });

  await tabTo(page, email);
  await expect(email).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(password).toBeFocused();

  await email.fill(user.email);
  await password.fill(user.password);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expectAuthStorageEmpty(page);
  await phase14.expectPageHealth(page);
});

test("keeps login and registration failure states safe and truthful", async ({
  page,
  phase14,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  let releaseLogin;
  const loginGate = new Promise((resolve) => {
    releaseLogin = resolve;
  });
  await page.route("**/api/v1/auth/login", async (route) => {
    await loginGate;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message:
            "Email or password is incorrect. Review the information and try again.",
          requestId: `login-browser-${"x".repeat(96)}`,
        },
      }),
    });
  });
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("failure@example.test");
  await page.getByLabel("Password").fill("SyntheticPassword1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("button", { name: "Signing in…" }),
  ).toBeDisabled();
  releaseLogin();
  await expect(page.getByRole("alert")).toContainText(
    "Email or password is incorrect.",
  );
  await expect(page.getByRole("alert")).toContainText(
    "Request ID: login-browser-",
  );
  await expect(page.getByRole("alert")).not.toContainText(
    "/api/v1/auth/login",
  );
  await expectNoHorizontalOverflow(page);
  await expectAuthStorageEmpty(page);
  await page.unroute("**/api/v1/auth/login");

  let releaseRegistration;
  const registrationGate = new Promise((resolve) => {
    releaseRegistration = resolve;
  });
  await page.route("**/api/v1/auth/register", async (route) => {
    await registrationGate;
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "REGISTRATION_FAILED",
          message:
            "Registration could not be completed. Check the details or sign in if you already have an account.",
          requestId: "registration-browser-request",
        },
      }),
    });
  });
  await page.goto("/register");
  await page
    .getByRole("textbox", { name: "Display name" })
    .fill("Synthetic Registration");
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("duplicate@example.test");
  await page.getByLabel("Password").fill("SyntheticPassword1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("button", { name: "Creating account…" }),
  ).toBeDisabled();
  releaseRegistration();
  await expect(page.getByRole("alert")).toContainText(
    "Registration could not be completed. Check the details or sign in if you already have an account.",
  );
  await expect(page.getByRole("alert")).not.toContainText(
    "EMAIL_ALREADY_REGISTERED",
  );
  await expectNoHorizontalOverflow(page);
  await expectAuthStorageEmpty(page);
  await page.unroute("**/api/v1/auth/register");
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
    page.getByRole("heading", { name: "Settings" }),
  ).toBeVisible();
  const signOut = page.getByRole("button", {
    name: "Sign out of this session",
  });
  await tabTo(page, signOut);
  await expect(signOut).toBeFocused();
  await page.keyboard.press("Enter");
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
      .getByRole("region", { name: "Account information" })
      .getByText(user.displayName),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Current session" }),
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
