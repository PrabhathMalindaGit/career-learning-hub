const { expect, test } = require("../support/fixtures.cjs");

async function contextLayout(page) {
  const context = page.getByRole("region", { name: "Session context" });
  const grid = context.locator("dl");
  await expect(grid.locator(":scope > div")).toHaveCount(3);
  return grid.evaluate((element) => {
    const gridRect = element.getBoundingClientRect();
    const entries = Array.from(element.children).map((entry) => {
      const rect = entry.getBoundingClientRect();
      return {
        width: rect.width,
      };
    });
    return {
      columnCount: getComputedStyle(element).gridTemplateColumns
        .split(" ")
        .filter(Boolean).length,
      gridWidth: gridRect.width,
      entries,
    };
  });
}

async function expectIntrinsicHeadingChip(page, sectionSelector) {
  const region = page.locator(sectionSelector);
  const heading = region.locator(
    ":scope > .interview-section-heading",
  );
  const chip = heading.locator(":scope > .interview-chip");
  await expect(chip).toBeVisible();
  const metrics = await heading.evaluate((element) => {
    const headingRect = element.getBoundingClientRect();
    const titleRect = element.firstElementChild.getBoundingClientRect();
    const chipRect = element
      .querySelector(":scope > .interview-chip")
      .getBoundingClientRect();
    return {
      headingLeft: headingRect.left,
      headingWidth: headingRect.width,
      titleBottom: titleRect.bottom,
      chipLeft: chipRect.left,
      chipTop: chipRect.top,
      chipWidth: chipRect.width,
    };
  });
  expect
    .soft(Math.abs(metrics.chipLeft - metrics.headingLeft))
    .toBeLessThan(2);
  expect
    .soft(metrics.chipWidth)
    .toBeLessThan(metrics.headingWidth / 2);
  expect
    .soft(metrics.chipTop)
    .toBeGreaterThanOrEqual(metrics.titleBottom);
}

test("@smoke creates and practices in an Interview session", async ({
  page,
  phase14,
}, testInfo) => {
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
  await page.getByLabel("Job description (optional)").fill(
    "Own platform reliability, incident response, and secure service delivery.",
  );
  await page.getByLabel("Practice mode").selectOption("study");
  await page.getByRole("button", { name: "Create session" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const breadcrumbs = page.getByRole("navigation", {
    name: "Breadcrumb",
  });
  await expect(breadcrumbs).toContainText(title);
  await expect(breadcrumbs).not.toContainText(/507f[0-9a-f]+/i);
  const contextWithJobDescription = page.getByRole("region", {
    name: "Session context",
  });
  await expect(
    contextWithJobDescription.locator("dl > div"),
  ).toHaveCount(4);
  await expect(
    contextWithJobDescription.getByText("Job description"),
  ).toBeVisible();

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
  await manualForm.getByLabel("Model answer").fill(
    "Use traces, metrics, and redacted structured logs.",
  );
  await manualForm.getByRole("button", { name: "Add question" }).click();
  await expect(
    page.getByRole("button", {
      name: "How do you keep a distributed system observable?",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Pin question" }).click();
  await expect(
    page.getByRole("button", {
      name: "Pinned: How do you keep a distributed system observable?",
    }),
  ).toBeVisible();
  await page.context().grantPermissions(["clipboard-write"]);
  await page.getByRole("button", { name: "Copy model answer" }).click();
  await expect(
    page.getByRole("status", { name: "Model answer copy status" }),
  ).toHaveText("Copied");

  await page.getByRole("link", { name: "All interview sessions" }).click();
  const studySessionList = page.getByRole("list", {
    name: "Interview sessions",
  });
  await expect(
    studySessionList.getByRole("heading", { name: "Platform Engineer" }),
  ).toBeVisible();
  await expect(studySessionList.getByText(title)).toBeVisible();
  await expect(studySessionList.getByText("Senior")).toBeVisible();
  await expect(studySessionList.getByText("Study")).toBeVisible();
  await expect(studySessionList.getByText("Active")).toBeVisible();
  await expect(studySessionList.getByLabel("1 question")).toBeVisible();
  await expect(studySessionList.locator("time")).toBeVisible();

  const writtenTitle = phase14.title("Written Interview");
  await page.getByRole("textbox", { name: "Session title" }).fill(
    writtenTitle,
  );
  await page.getByRole("textbox", { name: "Target role" }).fill(
    "Platform Engineer",
  );
  await page.getByRole("textbox", { name: "Experience level" }).fill(
    "Senior",
  );
  await page.getByRole("button", { name: "Create session" }).click();
  await expect(
    page.getByRole("heading", { name: writtenTitle }),
  ).toBeVisible();
  const contextWithoutJobDescription = page.getByRole("region", {
    name: "Session context",
  });
  await expect(
    contextWithoutJobDescription.getByText("Job description"),
  ).toHaveCount(0);
  if (testInfo.project.name === "desktop") {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 320, height: 720 },
      { width: 640, height: 450 },
    ]) {
      await page.setViewportSize(viewport);
      const layout = await contextLayout(page);
      if (viewport.width > 1080) {
        expect.soft(layout.columnCount).toBe(3);
      } else if (viewport.width > 560) {
        expect.soft(layout.columnCount).toBe(2);
        expect
          .soft(layout.entries.at(-1).width)
          .toBeGreaterThan(layout.gridWidth * 0.9);
      } else {
        expect.soft(layout.columnCount).toBe(1);
        expect(
          layout.entries.every(
            (entry) => entry.width > layout.gridWidth * 0.9,
          ),
        ).toBe(true);
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  await page.getByRole("button", { name: "Add manually" }).click();
  const writtenManualForm = page.locator("#manual-question-form");
  await writtenManualForm.getByLabel("Category", { exact: true }).fill(
    "Systems",
  );
  await writtenManualForm.getByLabel("Difficulty").selectOption("medium");
  await writtenManualForm.getByLabel("Question", { exact: true }).fill(
    "How do you keep a distributed system observable?",
  );
  await writtenManualForm
    .getByRole("button", { name: "Add question" })
    .click();
  await expect(
    page.getByRole("button", {
      name: "How do you keep a distributed system observable?",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pin question" }).click();
  await expect(
    page.getByRole("button", {
      name: "Pinned: How do you keep a distributed system observable?",
    }),
  ).toBeVisible();

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
  if (
    testInfo.project.name === "desktop" ||
    testInfo.project.name === "mobile"
  ) {
    if (testInfo.project.name === "desktop") {
      await page.setViewportSize({ width: 320, height: 720 });
    }
    await expectIntrinsicHeadingChip(page, ".interview-question-index");
    await expectIntrinsicHeadingChip(page, ".interview-practice-desk");
    await expectIntrinsicHeadingChip(page, ".interview-history");
    await phase14.expectPageHealth(page);
    if (testInfo.project.name === "desktop") {
      await page.setViewportSize({ width: 1440, height: 900 });
    }
  }

  await page.getByRole("link", { name: "All interview sessions" }).click();
  const sessionList = page.getByRole("list", {
    name: "Interview sessions",
  });
  await expect(sessionList.getByText(writtenTitle)).toBeVisible();
  await expect(sessionList.getByText("Written practice")).toBeVisible();
  await sessionList
    .getByRole("link", { name: `Open ${writtenTitle}` })
    .click();

  await page.getByRole("button", { name: "Generate questions" }).click();
  await expect(
    page.getByRole("region", { name: "Provider job status" }),
  ).toBeVisible();
  await phase14.expectPageHealth(page);
});
