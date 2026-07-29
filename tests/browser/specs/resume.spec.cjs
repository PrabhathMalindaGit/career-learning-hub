const { randomUUID } = require("node:crypto");
const { readFile } = require("node:fs/promises");
const mongoose = require("mongoose");
const { expect, test } = require("../support/fixtures.cjs");

const runtimeFile =
  "/private/tmp/career-learning-hub-phase14/runtime/runtime.json";

function pdfPageCount(buffer) {
  return (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? [])
    .length;
}

async function seedStoredResumeAnalysis(user, title) {
  const { mongoUri } = JSON.parse(await readFile(runtimeFile, "utf8"));
  const db = await mongoose.createConnection(mongoUri).asPromise();
  try {
    const userId = new mongoose.Types.ObjectId(user.id);
    const resume = await db.collection("resumes").findOne({ userId, title });
    if (!resume?.currentVersionId) {
      throw new Error("Synthetic Resume current version was not found.");
    }
    const version = await db.collection("resumeversions").findOne({
      _id: resume.currentVersionId,
      userId,
      resumeId: resume._id,
    });
    if (!version) {
      throw new Error("Synthetic ResumeVersion was not found.");
    }

    const bulletId = randomUUID();
    const suggestionId = randomUUID();
    const unchangedSuggestionId = randomUUID();
    const originalText =
      `Built <strong>synthetic</strong> service for international teams. ${"Measured reliable delivery across regions. ".repeat(
        24,
      )}`.slice(0, 1_650).trim();
    const rewrittenText =
      `Built <strong>synthetic</strong> service for international teams and added <script>alert('plain text')</script> observability. ${"Measured reliable delivery and documented outcomes across regions. ".repeat(
        22,
      )}`.slice(0, 1_850).trim();
    const rationale =
      `Adds concrete review detail while retaining a verification requirement. ${"Confirm every synthetic result before applying. ".repeat(
        12,
      )}`.slice(0, 850);
    const now = new Date();
    const analysisId = new mongoose.Types.ObjectId();
    const jobId = new mongoose.Types.ObjectId();
    const nextContent = {
      ...version.content,
      experience: [
        {
          id: randomUUID(),
          employer: "Synthetic Employer",
          jobTitle: "Platform Engineer",
          isCurrent: true,
          bullets: [{ id: bulletId, text: originalText }],
        },
      ],
    };

    await db.collection("resumeversions").updateOne(
      { _id: version._id, userId },
      { $set: { content: nextContent, updatedAt: now } },
    );
    await db.collection("jobrecords").insertOne({
      _id: jobId,
      userId,
      type: "resume.analyze",
      payload: {
        userId: String(userId),
        resumeId: String(resume._id),
        versionId: String(version._id),
        targetRole: "Platform Engineer",
      },
      status: "completed",
      priority: 0,
      attempts: 1,
      maxAttempts: 3,
      runAt: now,
      progress: 100,
      result: {
        analysisId: String(analysisId),
        resumeId: String(resume._id),
        resumeVersionId: String(version._id),
        totalScore: 86,
      },
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("resumeanalyses").insertOne({
      _id: analysisId,
      userId,
      resumeId: resume._id,
      resumeVersionId: version._id,
      jobId,
      target: { role: "Platform Engineer" },
      scoringVersion: "phase16d-synthetic-v1",
      promptVersion: "phase16d-synthetic-v1",
      provider: "synthetic-stored-analysis",
      model: "provider-free",
      scoreBreakdown: {
        keywordMatch: 20,
        clarity: 21,
        evidence: 22,
        formatting: 23,
      },
      totalScore: 86,
      issues: [],
      strengths: [],
      missingKeywords: [],
      suggestions: [
        {
          id: suggestionId,
          bulletId,
          originalText,
          rewrittenText,
          rationale,
          verificationRequired: true,
        },
        {
          id: unchangedSuggestionId,
          bulletId,
          originalText,
          rewrittenText: originalText,
          rationale: "No textual change is required for this stored example.",
          verificationRequired: false,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    return {
      analysisId: String(analysisId),
      jobId: String(jobId),
      bulletId,
      suggestionId,
      unchangedSuggestionId,
      originalText,
      rewrittenText,
    };
  } finally {
    await db.close();
  }
}

test("@smoke creates, edits, versions, validates, and guards a Resume", async ({
  page,
  phase14,
}) => {
  const unexpectedExportRequests = [];
  const providerRequests = [];
  page.on("request", (request) => {
    if (/\/(?:export|pdf)(?:\/|$|\?)/i.test(request.url())) {
      unexpectedExportRequests.push(request.url());
    }
    if (/generativelanguage|gemini|googleapis/i.test(request.url())) {
      providerRequests.push(request.url());
    }
  });
  const user = await phase14.createUser("resume");
  await phase14.login(page, user);
  await phase14.navigate(page, "Resumes");

  await expect(page.getByText(/No resumes yet/)).toBeVisible();
  await page
    .getByRole("button", { name: "Create blank resume" })
    .click();
  await expect(
    page.getByText("Enter a title with 1–120 characters."),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "New resume title" }),
  ).toHaveAttribute("aria-invalid", "true");

  const title = phase14.title("Resume");
  await page.getByRole("textbox", { name: "New resume title" }).fill(title);
  await page
    .getByRole("button", { name: "Create blank resume" })
    .click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const breadcrumbs = page.getByRole("navigation", {
    name: "Breadcrumb",
  });
  await expect(breadcrumbs).toContainText(title);
  await expect(breadcrumbs).not.toContainText(/507f[0-9a-f]+/i);

  await page.getByLabel("Full name").fill("Phase Fourteen Candidate");
  await expect(
    page.getByText("Unsaved changes", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save new version" })
    .click();
  await expect(page.getByText("Version 2 saved", { exact: true })).toBeVisible();
  await expect(page.getByText("Version 1", { exact: true })).toBeVisible();
  const printControls = page.getByRole("region", {
    name: "Print / Save as PDF",
  });
  await expect(printControls).toContainText("Current saved version 2");
  const paperSize = printControls.getByRole("combobox", {
    name: "Paper size",
  });
  await expect(paperSize).toHaveValue("A4");
  await expect(
    printControls.getByRole("button", {
      name: "Open print dialog for saved version 2",
    }),
  ).toBeEnabled();

  await page.route(
    "**/api/v1/resumes/*/design",
    async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "SYNTHETIC_DESIGN_FAILURE",
            message: "Synthetic design failure.",
            requestId: "phase16c-design-request-0001",
          },
        }),
      });
    },
    { times: 1 },
  );
  await paperSize.selectOption("LETTER");
  await expect(
    printControls.getByText("The paper size could not be saved."),
  ).toBeVisible();
  await expect(
    printControls.getByText(
      "Request ID: phase16c-design-request-0001",
    ),
  ).toBeVisible();
  await expect(paperSize).toHaveValue("A4");

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/design") &&
        response.request().method() === "PATCH" &&
        response.ok(),
    ),
    paperSize.selectOption("LETTER"),
  ]);
  await expect(paperSize).toHaveValue("LETTER");
  await expect(page.getByText("Paper size saved as Letter.")).toBeVisible();

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/design") &&
        response.request().method() === "PATCH" &&
        response.ok(),
    ),
    paperSize.selectOption("A4"),
  ]);
  await expect(paperSize).toHaveValue("A4");

  await page.getByRole("button", { name: "Add link" }).click();
  await page
    .getByRole("button", { name: "Save new version" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Review the highlighted resume content",
    }),
  ).toBeVisible();
  await expect(page.getByText("Link 1 needs a label.")).toBeVisible();
  await expect(page.getByText("Link 1 needs a URL.")).toBeVisible();
  await page.getByLabel("Link 1 label").fill("Synthetic portfolio");
  await page
    .getByLabel("Link 1 URL")
    .fill("https://example.test/synthetic-resume");
  await page
    .getByRole("button", { name: "Save new version" })
    .click();
  await expect(page.getByText("Version 3 saved", { exact: true })).toBeVisible();
  await expect(printControls).toContainText("Current saved version 3");
  await expect(
    page
      .getByLabel("Printable current saved version 3")
      .locator("a", { hasText: "Synthetic portfolio" }),
  ).toHaveAttribute(
    "href",
    "https://example.test/synthetic-resume",
  );

  const onePageA4 = await page.pdf({
    format: "A4",
    printBackground: true,
  });
  expect(pdfPageCount(onePageA4)).toBe(1);

  await page
    .getByRole("button", { name: "View version 2" })
    .click();
  await expect(printControls).toContainText("Historical saved version 2");
  await expect(
    page.getByLabel("Printable historical saved version 2"),
  ).toContainText("Phase Fourteen Candidate");
  await expect(
    page.getByLabel("Printable historical saved version 2"),
  ).not.toContainText("Synthetic portfolio");

  await page.evaluate(() => {
    window.__phase16cPrintCalls = 0;
    window.print = () => {
      window.__phase16cPrintCalls += 1;
      window.dispatchEvent(new Event("afterprint"));
    };
  });
  const titleBeforePrint = await page.title();
  await printControls
    .getByRole("button", {
      name: "Open print dialog for saved version 2",
    })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => window.__phase16cPrintCalls ?? 0),
    )
    .toBe(1);
  await expect.poll(() => page.title()).toBe(titleBeforePrint);

  await page
    .getByRole("button", { name: "Return to current draft" })
    .click();
  await expect(printControls).toContainText("Current saved version 3");

  const longSummary =
    `Synthetic leading completeness marker. ${"Synthetic multi-page print evidence. ".repeat(
      140,
    )}`;
  await page.getByLabel("Professional summary").fill(longSummary);
  const blockedPrint = printControls.getByRole("button", {
    name: "Open print dialog for saved version 3",
  });
  await expect(blockedPrint).toBeDisabled();
  await expect(
    printControls.getByText(/Save New Version or Discard/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save new version" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Discard draft changes" }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Save new version" })
    .click();
  await expect(page.getByText("Version 4 saved", { exact: true })).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByLabel("Printable current saved version 4"),
  ).toBeVisible();
  await expect(
    page.getByLabel("Printable current saved version 4"),
  ).toContainText("Synthetic leading completeness marker.");
  await expect(page.locator(".app-sidebar")).toBeHidden();
  await expect(page.locator(".app-header")).toBeHidden();
  await expect(
    page.getByRole("navigation", { name: "Breadcrumb" }),
  ).toBeHidden();
  await expect(page.getByRole("region", { name: "Resume editor" })).toBeHidden();
  await expect(printControls).toBeHidden();
  const longSurfaceOverflow = await page
    .getByLabel("Printable current saved version 4")
    .locator(".resume-paper")
    .evaluate((element) => getComputedStyle(element).overflow);
  expect(longSurfaceOverflow).toBe("visible");

  const multiPageA4 = await page.pdf({
    format: "A4",
    printBackground: true,
  });
  expect(pdfPageCount(multiPageA4)).toBeGreaterThan(1);
  await page.emulateMedia({ media: "screen" });

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith("/design") &&
        response.request().method() === "PATCH" &&
        response.ok(),
    ),
    paperSize.selectOption("LETTER"),
  ]);
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByLabel("Printable current saved version 4"),
  ).toHaveAttribute("data-page-size", "LETTER");
  const multiPageLetter = await page.pdf({
    format: "Letter",
    printBackground: true,
  });
  expect(pdfPageCount(multiPageLetter)).toBeGreaterThan(1);
  await page.emulateMedia({ media: "screen" });
  expect(unexpectedExportRequests).toEqual([]);

  const storedAnalysis = await seedStoredResumeAnalysis(user, title);
  await page.route(
    "**/api/v1/resume-analyses/resumes/*/analyze",
    async (route) => {
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            job: {
              id: storedAnalysis.jobId,
              type: "resume.analyze",
              status: "queued",
            },
          },
        }),
      });
    },
    { times: 1 },
  );
  await page
    .getByRole("textbox", { name: "Target role" })
    .fill("Platform Engineer");
  await page
    .getByRole("button", { name: "Run AI-assisted assessment" })
    .click();

  const recommendations = page.getByRole("complementary", {
    name: "AI-assisted assessment",
  });
  await expect(recommendations).toContainText("Original");
  await expect(recommendations).toContainText("Suggested rewrite");
  await expect(recommendations).toContainText("Reason");
  await expect(recommendations).toContainText(
    "Verify facts and placeholders before accepting.",
  );
  await expect(recommendations).toContainText("<strong>");
  await expect(recommendations).toContainText("<script>");
  await expect(recommendations.getByText("Removed").first()).toBeVisible();
  await expect(recommendations.getByText("Added").first()).toBeVisible();
  await expect(recommendations.locator("del").first()).toBeVisible();
  await expect(recommendations.locator("ins").first()).toBeVisible();
  await expect(
    recommendations.getByText(
      "No textual change is required for this stored example.",
    ),
  ).toBeVisible();
  await expect(recommendations.locator("script")).toHaveCount(0);
  await expect(recommendations.locator("strong")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    storedAnalysis.analysisId,
  );
  await expect(page.locator("body")).not.toContainText(
    storedAnalysis.suggestionId,
  );
  await expect(page.locator("body")).not.toContainText(
    storedAnalysis.unchangedSuggestionId,
  );
  await expect(page.locator("body")).not.toContainText(
    storedAnalysis.bulletId,
  );

  const firstSuggestion = recommendations.getByRole("checkbox", {
    name: "Select suggestion 1",
  });
  const unchangedSuggestion = recommendations.getByRole("checkbox", {
    name: "Select suggestion 2",
  });
  await expect(firstSuggestion).not.toBeChecked();
  await expect(unchangedSuggestion).not.toBeChecked();
  await expect(
    recommendations.getByRole("button", {
      name: "Apply selected suggestions",
    }),
  ).toBeDisabled();
  await firstSuggestion.focus();
  await page.keyboard.press("Space");
  await expect(firstSuggestion).toBeChecked();
  await expect(unchangedSuggestion).not.toBeChecked();

  const applyButton = recommendations.getByRole("button", {
    name: "Apply selected suggestions",
  });
  await applyButton.focus();
  await page.keyboard.press("Enter");
  const applyDialog = page.getByRole("dialog", {
    name: "Apply selected suggestions",
  });
  await expect(applyDialog).toBeVisible();
  await applyDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(applyDialog).toBeHidden();
  await expect(firstSuggestion).toBeChecked();

  await expect(applyButton).toBeFocused();
  await page.keyboard.press("Enter");
  const applyRequestPromise = page.waitForRequest(
    (request) =>
      request.url().includes("/rewrites/apply") &&
      request.method() === "POST",
  );
  await applyDialog
    .getByRole("button", { name: "Create new version" })
    .click();
  const applyRequest = await applyRequestPromise;
  expect(applyRequest.postDataJSON()).toEqual({
    analysisId: storedAnalysis.analysisId,
    suggestionIds: [storedAnalysis.suggestionId],
  });
  await expect(
    page.getByText("1 suggestion applied in version 5."),
  ).toBeVisible();
  await expect(page.getByText("This assessment is stale.")).toBeVisible();
  await expect(firstSuggestion).toBeDisabled();
  await expect(printControls).toContainText("Current saved version 5");
  expect(providerRequests).toEqual([]);
  await phase14.expectPageHealth(page);

  await page.getByLabel("Full name").fill("Unsaved Candidate");
  await phase14.navigate(page, "Dashboard");
  const dialog = page.getByRole("dialog", { name: "Unsaved changes" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await phase14.navigate(page, "Dashboard");
  await dialog
    .getByRole("button", { name: "Leave without saving" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Unified dashboard" }),
  ).toBeVisible();
  await phase14.expectPageHealth(page);
});
