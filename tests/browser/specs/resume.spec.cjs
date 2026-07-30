const { randomUUID } = require("node:crypto");
const { mkdir, readFile } = require("node:fs/promises");
const mongoose = require("mongoose");
const { expect, test } = require("../support/fixtures.cjs");

const runtimeFile =
  "/private/tmp/career-learning-hub-phase14/runtime/runtime.json";
const captureRoot =
  "/private/tmp/career-learning-hub-ui-lr1-captures";

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

async function readStoredResumeFacts(user, title) {
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
    return {
      currentVersionId: String(resume.currentVersionId),
      versionCount: await db.collection("resumeversions").countDocuments({
        userId,
        resumeId: resume._id,
      }),
      fullName: version.content?.basics?.fullName,
      design: resume.design,
    };
  } finally {
    await db.close();
  }
}

async function setStoredResumeDesign(user, title, design) {
  const { mongoUri } = JSON.parse(await readFile(runtimeFile, "utf8"));
  const db = await mongoose.createConnection(mongoUri).asPromise();
  try {
    const userId = new mongoose.Types.ObjectId(user.id);
    const result = await db.collection("resumes").updateOne(
      { userId, title },
      { $set: { design, updatedAt: new Date() } },
    );
    if (result.matchedCount !== 1) {
      throw new Error("Synthetic Resume design target was not found.");
    }
  } finally {
    await db.close();
  }
}

async function seedResumeListCards(user) {
  const { mongoUri } = JSON.parse(await readFile(runtimeFile, "utf8"));
  const db = await mongoose.createConnection(mongoUri).asPromise();
  try {
    const userId = new mongoose.Types.ObjectId(user.id);
    const now = new Date();
    const records = [
      {
        title:
          "Synthetic Principal Platform Engineering Resume for International Product Teams",
        status: "active",
        design: {
          templateId: "modern-professional",
          colorPaletteId: "forest",
          pageSize: "A4",
          fontFamily: "Arial",
          showProfilePhoto: false,
        },
      },
      {
        title: "Synthetic Compact Technical Portfolio",
        status: "archived",
        design: {
          templateId: "compact-technical",
          colorPaletteId: "navy",
          pageSize: "LETTER",
          fontFamily: "Georgia",
          showProfilePhoto: false,
        },
      },
    ];

    for (const record of records) {
      const resumeId = new mongoose.Types.ObjectId();
      const versionId = new mongoose.Types.ObjectId();
      await db.collection("resumes").insertOne({
        _id: resumeId,
        userId,
        title: record.title,
        status: record.status,
        currentVersionId: versionId,
        latestVersionNumber: 1,
        design: record.design,
        createdAt: now,
        updatedAt: now,
      });
      await db.collection("resumeversions").insertOne({
        _id: versionId,
        userId,
        resumeId,
        versionNumber: 1,
        source: "manual",
        content: {
          basics: { fullName: "", links: [] },
          experience: [],
          education: [],
          skills: [],
          projects: [],
          certifications: [],
          languages: [],
          interests: [],
        },
        createdAt: now,
        updatedAt: now,
      });
    }
  } finally {
    await db.close();
  }
}

test("@smoke creates, edits, versions, validates, and guards a Resume", async ({
  page,
  phase14,
}, testInfo) => {
  test.setTimeout(120_000);
  const unexpectedExportRequests = [];
  const providerRequests = [];
  const designPatchBodies = [];
  page.on("request", (request) => {
    if (/\/(?:export|pdf)(?:\/|$|\?)/i.test(request.url())) {
      unexpectedExportRequests.push(request.url());
    }
    if (/generativelanguage|gemini|googleapis/i.test(request.url())) {
      providerRequests.push(request.url());
    }
    if (
      request.url().endsWith("/design") &&
      request.method() === "PATCH"
    ) {
      designPatchBodies.push(request.postDataJSON());
    }
  });
  const user = await phase14.createUser("resume");
  if (testInfo.project.name === "desktop") {
    await mkdir(captureRoot, { recursive: true });
  }
  await phase14.login(page, user);
  await phase14.navigate(page, "Resumes");

  await expect(
    page.getByText(
      "No resumes yet. Create a blank resume or import a private PDF.",
      { exact: true },
    ),
  ).toBeVisible();
  if (testInfo.project.name === "desktop") {
    await page.screenshot({
      path: `${captureRoot}/legacy-port-resume-list-empty.png`,
      fullPage: true,
    });
  }
  const pdfDropzone = page.getByRole("group", {
    name: "Private PDF dropzone",
  });
  const pdfPicker = page.getByRole("button", {
    name: "Choose a private PDF",
  });
  await expect(pdfDropzone).toContainText("PDF only · maximum 15 MB");
  await pdfPicker.focus();
  await expect(pdfPicker).toBeFocused();
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.keyboard.press("Enter"),
  ]);
  await fileChooser.setFiles("tests/browser/fixtures/synthetic-learning.pdf");
  await expect(pdfDropzone).toContainText("synthetic-learning.pdf");
  if (testInfo.project.name === "desktop") {
    await page.screenshot({
      path: `${captureRoot}/legacy-port-pdf-dropzone.png`,
      fullPage: true,
    });
  }
  await pdfDropzone
    .getByRole("button", { name: "Clear selection" })
    .click();
  await pdfDropzone.evaluate((element) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(["%PDF-synthetic"], "drag-state.pdf", {
        type: "application/pdf",
      }),
    );
    element.dispatchEvent(
      new DragEvent("dragenter", {
        bubbles: true,
        dataTransfer: transfer,
      }),
    );
  });
  await expect(pdfDropzone).toHaveAttribute("data-drag-active", "true");
  await pdfDropzone.evaluate((element) => {
    element.dispatchEvent(new DragEvent("dragleave", { bubbles: true }));
  });
  await expect(pdfDropzone).toHaveAttribute("data-drag-active", "false");
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

  const workspaceLayout = page.locator(".resume-workspace-grid");
  const livePreviewPanel = page.getByRole("region", {
    name: "Live preview",
  });
  const aiAssessmentPanel = page.getByRole("complementary", {
    name: "AI-assisted assessment",
  });
  const versionHistoryPanel = page.getByRole("region", {
    name: "Version history",
  });
  const applySuggestionsButton = aiAssessmentPanel.getByRole("button", {
    name: "Apply selected suggestions",
  });
  const workspaceOrder = await workspaceLayout.evaluate((element) => {
    const children = Array.from(element.children);
    const aiPanel = children.at(3);
    const history = document.querySelector(
      '[aria-labelledby="resume-version-history-title"]',
    );
    const applyButton = aiPanel?.querySelector("button");
    return {
      labels: children.map((child) =>
        child.getAttribute("aria-labelledby"),
      ),
      historyFollows:
        aiPanel !== undefined &&
        history !== null &&
        Boolean(
          aiPanel.compareDocumentPosition(history) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      applyContained:
        applyButton !== null &&
        applyButton !== undefined &&
        aiPanel?.contains(applyButton),
    };
  });
  expect(workspaceOrder.labels).toEqual([
    "resume-editor-title",
    "resume-preview-title",
    "resume-analysis-runner-title",
    "resume-ai-title",
  ]);
  expect(workspaceOrder.historyFollows).toBe(true);
  expect(workspaceOrder.applyContained).toBe(true);
  await expect(versionHistoryPanel).toBeVisible();
  await expect(applySuggestionsButton).toBeVisible();
  expect(
    await workspaceLayout.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(" ").length,
    ),
  ).toBe(1);
  await expect
    .poll(() =>
      livePreviewPanel.evaluate(
        (element) => getComputedStyle(element).position,
      ),
    )
    .toBe("static");
  const livePaperSizing = await livePreviewPanel
    .locator(".resume-paper")
    .evaluate((element) => {
      const paper = element.getBoundingClientRect();
      const panel = element.parentElement?.getBoundingClientRect();
      return {
        width: paper.width,
        leftGap: panel ? paper.left - panel.left : 0,
        rightGap: panel ? panel.right - paper.right : 0,
      };
    });
  expect(livePaperSizing.width).toBeLessThanOrEqual(860);
  expect(
    Math.abs(livePaperSizing.leftGap - livePaperSizing.rightGap),
  ).toBeLessThan(2);

  const sectionNavigation = page.getByRole("navigation", {
    name: "Resume sections",
  });
  const resumeSections = [
    ["Basics", "resume-section-basics"],
    ["Links", "resume-section-links"],
    ["Experience", "resume-section-experience"],
    ["Education", "resume-section-education"],
    ["Skills", "resume-section-skills"],
    ["Projects", "resume-section-projects"],
    ["Certifications", "resume-section-certifications"],
    ["Languages", "resume-section-languages"],
    ["Interests", "resume-section-interests"],
  ];
  await expect(sectionNavigation.getByRole("link")).toHaveCount(9);
  await expect
    .poll(() =>
      sectionNavigation.evaluate((element) => getComputedStyle(element).position),
    )
    .toBe(testInfo.project.name === "desktop" ? "sticky" : "static");
  for (const [sectionName, sectionId] of resumeSections) {
    const sectionLink = sectionNavigation.getByRole("link", {
      name: sectionName,
      exact: true,
    });
    await expect(sectionLink).toHaveAttribute(
      "href",
      new RegExp(`#${sectionId}$`),
    );
    await sectionLink.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => location.hash)).toBe(
      `#${sectionId}`,
    );
    await expect(
      page.locator(`#${sectionId}`).getByRole("heading", {
        name: sectionName,
        exact: true,
      }),
    ).toBeInViewport();
  }
  await sectionNavigation
    .getByRole("link", { name: "Basics", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await sectionNavigation
    .getByRole("link", { name: "Certifications", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  if (testInfo.project.name === "desktop") {
    const sectionTop = await page
      .locator("#resume-section-certifications")
      .evaluate((element) => element.getBoundingClientRect().top);
    const navigationBottom = await sectionNavigation.evaluate(
      (element) => element.getBoundingClientRect().bottom,
    );
    expect(sectionTop).toBeGreaterThanOrEqual(navigationBottom);
  }
  await page.goBack();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(
    "#resume-section-basics",
  );

  const email = page.getByLabel("Email");
  const saveVersion = page.getByRole("button", {
    name: "Save new version",
  });
  await email.fill("invalid-address");
  await saveVersion.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("alert")).toContainText(
    "Email needs a valid address.",
  );
  await expect(saveVersion).toBeFocused();
  await email.fill("");

  await page.getByLabel("Full name").fill("Phase Fourteen Candidate");
  await expect(
    page.getByText("Unsaved changes", { exact: true }),
  ).toBeVisible();
  await saveVersion.click();
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

  const designControls = page.getByRole("region", {
    name: "Resume design controls",
  });
  const templateChoice = (templateId) =>
    designControls.locator(
      `input[name="resume-template"][value="${templateId}"]`,
    );
  async function selectTemplate(templateId) {
    const choice = templateChoice(templateId);
    if (!(await choice.isChecked())) await choice.check();
  }
  const fontChoice = (fontFamily) =>
    designControls.locator(
      `input[name="resume-font"][value="${fontFamily}"]`,
    );
  const paletteChoice = (colorPaletteId) =>
    designControls.locator(
      `input[name="resume-palette"][value="${colorPaletteId}"]`,
    );
  async function saveDesignSelection(templateId, fontFamily, colorPaletteId) {
    await selectTemplate(templateId);
    await fontChoice(fontFamily).check();
    await paletteChoice(colorPaletteId).check();
    const saveButton = designControls.getByRole("button", {
      name: "Save design",
    });
    if (await saveButton.isEnabled()) {
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().endsWith("/design") &&
            response.request().method() === "PATCH" &&
            response.ok(),
        ),
        saveButton.click(),
      ]);
    }
  }
  async function savePaperSize(pageSize) {
    if ((await paperSize.inputValue()) === pageSize) return;
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/design") &&
          response.request().method() === "PATCH" &&
          response.ok(),
      ),
      paperSize.selectOption(pageSize),
    ]);
  }
  await expect(templateChoice("ats-classic")).toBeChecked();
  await expect(designControls.getByRole("radio")).toHaveCount(9);
  await expect(fontChoice("Inter")).toBeChecked();
  await expect(paletteChoice("slate")).toBeChecked();
  const canonicalFactsBeforeDesign = await readStoredResumeFacts(user, title);

  await selectTemplate("modern-professional");
  await fontChoice("Arial").check();
  await paletteChoice("forest").check();
  const livePreview = page.getByLabel("Resume preview");
  await expect(livePreview).toHaveAttribute(
    "data-template",
    "modern-professional",
  );
  await expect(livePreview).toHaveClass(/resume-font-arial/);
  await expect(livePreview).toHaveClass(/resume-palette-forest/);
  await expect(page.getByText("Unsaved changes", { exact: true })).toHaveCount(0);
  if (testInfo.project.name === "desktop") {
    await designControls.screenshot({
      path: `${captureRoot}/legacy-port-template-gallery.png`,
    });
  }

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
            requestId: "phase16e-design-request-0001",
          },
        }),
      });
    },
    { times: 1 },
  );
  await designControls.getByRole("button", { name: "Save design" }).click();
  await expect(
    designControls.getByText("The resume design could not be saved."),
  ).toBeVisible();
  await expect(
    designControls.getByText("Request ID: phase16e-design-request-0001"),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Printable current saved version 2")
      .locator(".resume-paper"),
  ).toHaveAttribute("data-template", "ats-classic");

  await selectTemplate("compact-technical");
  await fontChoice("Georgia").check();
  await paletteChoice("navy").check();
  const designRequestPromise = page.waitForRequest(
    (request) =>
      request.url().endsWith("/design") &&
      request.method() === "PATCH",
  );
  await designControls.getByRole("button", { name: "Save design" }).click();
  const designRequest = await designRequestPromise;
  expect(designRequest.postDataJSON()).toEqual({
    templateId: "compact-technical",
    colorPaletteId: "navy",
    pageSize: "A4",
    fontFamily: "Georgia",
    showProfilePhoto: false,
  });
  await expect(
    designControls.getByText("Resume design saved."),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Printable current saved version 2")
      .locator(".resume-paper"),
  ).toHaveClass(/resume-template-compact-technical/);

  if (testInfo.project.name === "desktop") {
    await page.reload();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(templateChoice("compact-technical")).toBeChecked();
    await expect(fontChoice("Georgia")).toBeChecked();
    await expect(paletteChoice("navy")).toBeChecked();
    await expect(paperSize).toHaveValue("A4");
    await expect(page.getByLabel("Full name")).toHaveValue(
      "Phase Fourteen Candidate",
    );
    await expect(
      page.getByText("Version 2 saved", { exact: true }),
    ).toBeVisible();
    const canonicalFactsAfterDesign = await readStoredResumeFacts(user, title);
    expect(canonicalFactsAfterDesign.currentVersionId).toBe(
      canonicalFactsBeforeDesign.currentVersionId,
    );
    expect(canonicalFactsAfterDesign.versionCount).toBe(
      canonicalFactsBeforeDesign.versionCount,
    );
    expect(canonicalFactsAfterDesign.fullName).toBe(
      canonicalFactsBeforeDesign.fullName,
    );

    const patchesBeforeUnknownRemount = designPatchBodies.length;
    await setStoredResumeDesign(user, title, {
      templateId: "unknown-template injected-class",
      colorPaletteId: "unknown-palette<script>",
      pageSize: "A4",
      fontFamily: 'unknown-font";color:red',
      showProfilePhoto: false,
    });
    await phase14.navigate(page, "Resumes");
    await page.getByRole("link", { name: `Open ${title}` }).click();
    await expect(
      designControls.getByText(/saved design choices are no longer available/i),
    ).toBeVisible();
    await expect(livePreview).toHaveAttribute("data-template", "ats-classic");
    await expect(livePreview).toHaveClass(/resume-font-inter/);
    await expect(livePreview).toHaveClass(/resume-palette-slate/);
    await expect(page.locator("body")).not.toContainText(
      "unknown-template injected-class",
    );
    await expect(page.locator("body")).not.toContainText(
      "unknown-palette<script>",
    );
    await expect(page.locator("body")).not.toContainText(
      'unknown-font";color:red',
    );
    expect(await livePreview.getAttribute("style")).toBeNull();
    expect(designPatchBodies.length).toBe(patchesBeforeUnknownRemount);

    await selectTemplate("modern-professional");
    await designControls
      .getByRole("button", { name: "Reset changes" })
      .click();
    await expect(
      designControls.locator('input[name="resume-template"]:checked'),
    ).toHaveCount(0);
    await selectTemplate("ats-classic");
    await fontChoice("Inter").check();
    await paletteChoice("slate").check();
    await designControls.getByRole("button", { name: "Save design" }).click();
    await expect(
      designControls.getByText("Resume design saved."),
    ).toBeVisible();
  } else {
    await saveDesignSelection("ats-classic", "Inter", "slate");
  }
  await expect(paperSize).toHaveValue("A4");
  await expect(
    designControls.getByText(/historical saved content uses this current design/i),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    /ATS (?:percentage|score|certified|guaranteed)/i,
  );

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
  if (testInfo.project.name === "desktop") {
    const onePageDesigns = [
      ["ats-classic", "Inter", "slate"],
      ["modern-professional", "Arial", "forest"],
      ["compact-technical", "Georgia", "navy"],
    ];
    for (const [templateId, fontFamily, colorPaletteId] of onePageDesigns) {
      await saveDesignSelection(templateId, fontFamily, colorPaletteId);
      for (const pageSize of ["A4", "LETTER"]) {
        await savePaperSize(pageSize);
        const pdf = await page.pdf({
          format: pageSize === "LETTER" ? "Letter" : "A4",
          printBackground: true,
        });
        expect(pdfPageCount(pdf)).toBe(1);
      }
    }
    await saveDesignSelection("ats-classic", "Inter", "slate");
    await savePaperSize("A4");
  }

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
  await expect(
    page.getByLabel("Resume version 2 preview"),
  ).toHaveClass(/resume-template-ats-classic/);

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
  if (testInfo.project.name === "desktop") {
    const multipageDesigns = [
      ["modern-professional", "Arial", "forest"],
      ["compact-technical", "Georgia", "navy"],
    ];
    for (const [templateId, fontFamily, colorPaletteId] of multipageDesigns) {
      await saveDesignSelection(templateId, fontFamily, colorPaletteId);
      for (const pageSize of ["A4", "LETTER"]) {
        await savePaperSize(pageSize);
        await page.emulateMedia({ media: "print" });
        const pdf = await page.pdf({
          format: pageSize === "LETTER" ? "Letter" : "A4",
          printBackground: true,
        });
        expect(pdfPageCount(pdf)).toBeGreaterThan(1);
        await page.emulateMedia({ media: "screen" });
      }
    }
    await saveDesignSelection("ats-classic", "Inter", "slate");
    await savePaperSize("LETTER");
  }
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

  if (testInfo.project.name === "desktop") {
    await templateChoice("ats-classic").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(templateChoice("compact-technical")).toBeChecked();
    const focusedOutline = await templateChoice("compact-technical").evaluate(
      (element) => getComputedStyle(element).outlineStyle,
    );
    expect(focusedOutline).not.toBe("none");
    await designControls
      .getByRole("button", { name: "Reset changes" })
      .focus();
    await page.keyboard.press("Enter");
    await expect(templateChoice("ats-classic")).toBeChecked();

    const responsiveViewports = [
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 320, height: 720 },
      { width: 720, height: 450 },
    ];
    for (const viewport of responsiveViewports) {
      await page.setViewportSize(viewport);
      await expect(designControls).toBeVisible();
      await expect(templateChoice("ats-classic")).toBeVisible();
      await expect(fontChoice("Inter")).toBeVisible();
      await expect(paletteChoice("slate")).toBeVisible();
      await expect(page.getByLabel("Resume preview")).toBeVisible();
      await expect(printControls).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Breadcrumb" }),
      ).toBeVisible();
      await expect(recommendations).toBeVisible();
      if (viewport.width === 390) {
        await designControls.screenshot({
          path: `${captureRoot}/legacy-port-design-mobile.png`,
        });
      }
      await phase14.expectPageHealth(page);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  }

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

  await seedResumeListCards(user);
  await phase14.navigate(page, "Resumes");
  const resumeCards = page.locator(".resume-record-card");
  await expect(resumeCards).toHaveCount(3);
  await expect(
    page.getByText(
      "Synthetic Principal Platform Engineering Resume for International Product Teams",
    ),
  ).toBeVisible();
  await expect(
    page.locator('[data-resume-card-preview="ats-classic"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('[data-resume-card-preview="modern-professional"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('[data-resume-card-preview="compact-technical"]'),
  ).toHaveCount(1);
  await expect(
    page.getByRole("region", { name: "Your resumes" }),
  ).not.toContainText(
    /ATS score|recruiter|application views|job outcomes|analysis count/i,
  );
  await phase14.expectPageHealth(page);

  if (testInfo.project.name === "desktop") {
    const listViewports = [
      { width: 1920, height: 1080 },
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 320, height: 720 },
    ];
    for (const viewport of listViewports) {
      await page.setViewportSize(viewport);
      await expect(resumeCards).toHaveCount(3);
      await expect(pdfDropzone).toBeVisible();
      await phase14.expectPageHealth(page);
      if (viewport.width === 1920) {
        await page.waitForTimeout(350);
        await page.screenshot({
          path: `${captureRoot}/legacy-port-resume-list-desktop.png`,
          fullPage: true,
        });
      }
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() =>
        resumeCards
          .first()
          .evaluate((element) => getComputedStyle(element).animationName),
      )
      .toBe("none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1440, height: 900 });
  }
});
