const path = require("node:path");
const fs = require("node:fs");
const { expect, test } = require("../support/fixtures.cjs");

const evidenceRoot =
  process.env.UI_LA2_SCREENSHOT_DIR || process.env.UI_LA1_SCREENSHOT_DIR;

async function capture(page, name) {
  if (!evidenceRoot) return;
  fs.mkdirSync(evidenceRoot, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceRoot, name),
    fullPage: true,
  });
}

async function captureElement(locator, name) {
  if (!evidenceRoot) return;
  fs.mkdirSync(evidenceRoot, { recursive: true });
  await locator.screenshot({ path: path.join(evidenceRoot, name) });
}

test("@smoke covers private PDF, chat, Flashcards, and Quiz secrecy", async ({
  page,
  phase14,
}, testInfo) => {
  const project = testInfo.project.name;
  const nonLocalRequests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) &&
      !["about:", "blob:", "chrome:", "chrome-extension:", "data:"].includes(
        url.protocol,
      )
    ) {
      nonLocalRequests.push(url.origin);
    }
  });
  const user = await phase14.createUser("learning");
  await phase14.login(page, user);
  await phase14.navigate(page, "Learning");
  await expect(
    page.getByRole("heading", { name: "No documents yet" }),
  ).toBeVisible();
  if (project === "desktop") {
    await capture(page, "ui-la1-learning-library-empty.png");

    const documentListPattern = "**/api/v1/learning-documents?*";
    await page.route(documentListPattern, (route) => route.abort());
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Documents unavailable" }),
    ).toBeVisible();
    await capture(page, "ui-la1-learning-library-error.png");
    await page.unroute(documentListPattern);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "No documents yet" }),
    ).toBeVisible();
  }

  await page.getByRole("button", { name: "Upload PDF" }).click();
  const title = phase14.title("Learning");
  await page.getByLabel("PDF file").setInputFiles(
    path.resolve(__dirname, "../fixtures/synthetic-learning.pdf"),
  );
  await expect(page.getByText("Selected: synthetic-learning.pdf"))
    .toBeVisible();
  await page.getByRole("button", { name: "Upload document" }).click();
  await expect(page.getByText("Enter a document title."))
    .toBeVisible();
  if (project === "desktop") {
    await capture(page, "ui-la1-upload-selected-and-validation.png");
  }

  await page.getByRole("textbox", { name: "Document title" }).fill(title);
  await page.getByRole("button", { name: "Upload document" }).click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();

  const records = await phase14.promoteLearningDocument(user, title);
  await phase14.navigate(page, "Dashboard");
  await phase14.navigate(page, "Learning");
  const documentCard = page.getByRole("article", {
    name: title,
    exact: true,
  });
  await expect(documentCard).toContainText("PDF document");
  await expect(documentCard).not.toContainText(/file size|flashcards|quizzes/i);
  const documentCollection = page.locator(".learning-document-list");
  const [collectionBox, cardBox] = await Promise.all([
    documentCollection.boundingBox(),
    documentCard.boundingBox(),
  ]);
  expect(collectionBox).not.toBeNull();
  expect(cardBox).not.toBeNull();
  const cardWidthRatio = cardBox.width / collectionBox.width;
  if (project === "desktop") {
    expect(cardWidthRatio).toBeLessThan(0.6);
  } else if (project === "mobile") {
    expect(cardWidthRatio).toBeGreaterThan(0.9);
  }
  if (project === "desktop") {
    await capture(page, "ui-la1-learning-library-desktop-repaired.png");
    const additionalDocuments = [
      {
        title: `${title} — A deliberately long dossier title that must wrap without widening the collection`,
        filename:
          "a-deliberately-long-private-learning-document-filename-that-must-wrap-safely.pdf",
      },
      {
        title: `${title} companion dossier`,
        filename: "companion-learning-document.pdf",
      },
    ];
    for (const additionalDocument of additionalDocuments) {
      await page.getByRole("button", { name: "Upload PDF" }).click();
      await page
        .getByRole("textbox", { name: "Document title" })
        .fill(additionalDocument.title);
      await page.getByLabel("PDF file").setInputFiles({
        name: additionalDocument.filename,
        mimeType: "application/pdf",
        buffer: fs.readFileSync(
          path.resolve(__dirname, "../fixtures/synthetic-learning.pdf"),
        ),
      });
      await page.getByRole("button", { name: "Upload document" }).click();
      await expect(
        page.getByRole("heading", { name: additionalDocument.title }),
      ).toBeVisible();
    }
    const desktopCards = page.locator(".learning-document-row");
    await expect(desktopCards).toHaveCount(3);
    const cardTopCoordinates = await desktopCards.evaluateAll((cards) =>
      cards.map((card) => card.getBoundingClientRect().top),
    );
    expect(
      Math.max(...cardTopCoordinates) - Math.min(...cardTopCoordinates),
    ).toBeLessThan(2);
    const longDocumentCard = page.getByRole("article", {
      name: additionalDocuments[0].title,
    });
    await expect(longDocumentCard).toContainText("Uploaded");
    await expect(longDocumentCard).not.toContainText(/extracted section|page/i);
    await phase14.expectPageHealth(page);
    await capture(
      page,
      "ui-la1-learning-library-multiple-documents-repaired.png",
    );
  } else if (project === "mobile") {
    await capture(page, "ui-la1-mobile-library-repaired.png");
  }
  await documentCard.getByRole("link", { name: "Open workspace" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  const breadcrumbs = page.getByRole("navigation", {
    name: "Breadcrumb",
  });
  await expect(breadcrumbs).toContainText(title);
  await expect(breadcrumbs).not.toContainText(records.documentId);
  await expect(page.getByRole("region", { name: "Stored summary" }))
    .toBeVisible();
  await expect(page.getByRole("region", { name: "Stored key points" }))
    .toBeVisible();
  if (project === "desktop") {
    await capture(page, "ui-la1-document-overview-desktop.png");
  } else if (project === "tablet") {
    await capture(page, "ui-la1-tablet.png");
  }

  const overviewTab = page.getByRole("tab", { name: "Overview" });
  await overviewTab.focus();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Quizzes" }))
    .toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(overviewTab).toHaveAttribute("aria-selected", "true");

  await page.getByRole("tab", { name: "Flashcards" }).click();
  const flashcardCollection = page.getByRole("region", {
    name: "Flashcard sets",
  });
  await expect(flashcardCollection).toContainText("Phase 14 flashcards");
  await expect(flashcardCollection).toContainText("Ready to study");
  if (project === "desktop") {
    await capture(page, "ui-la2-flashcard-collection-desktop.png");

    const flashcardListPattern = "**/api/v1/flashcard-sets?*";
    await page.route(flashcardListPattern, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            sets: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
          },
        }),
      }),
    );
    await page.getByRole("tab", { name: "Quizzes" }).click();
    await page.getByRole("tab", { name: "Flashcards" }).click();
    await expect(
      page.getByRole("heading", { name: "No flashcard sets yet." }),
    ).toBeVisible();
    await page.unroute(flashcardListPattern);

    await page.route(flashcardListPattern, (route) => route.abort());
    await page.getByRole("tab", { name: "Quizzes" }).click();
    await page.getByRole("tab", { name: "Flashcards" }).click();
    await expect(
      page.getByRole("button", { name: "Try flashcard sets again" }),
    ).toBeVisible();
    await page.unroute(flashcardListPattern);
    await page
      .getByRole("button", { name: "Try flashcard sets again" })
      .click();
    await expect(flashcardCollection).toContainText("Phase 14 flashcards");
  }

  await page.getByRole("tab", { name: "Quizzes" }).click();
  const quizCollection = page.getByRole("region", { name: "Quizzes" });
  await expect(quizCollection).toContainText("Phase 14 quiz");
  await expect(quizCollection).toContainText("Ready to take");
  if (project === "desktop") {
    await capture(page, "ui-la2-quiz-collection-desktop.png");

    const quizListPattern = "**/api/v1/quizzes?*";
    await page.route(quizListPattern, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            quizzes: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
          },
        }),
      }),
    );
    await page.getByRole("tab", { name: "Flashcards" }).click();
    await page.getByRole("tab", { name: "Quizzes" }).click();
    await expect(
      page.getByRole("heading", { name: "No quizzes yet." }),
    ).toBeVisible();
    await page.unroute(quizListPattern);

    await page.route(quizListPattern, (route) => route.abort());
    await page.getByRole("tab", { name: "Flashcards" }).click();
    await page.getByRole("tab", { name: "Quizzes" }).click();
    await expect(
      page.getByRole("button", { name: "Try quiz list again" }),
    ).toBeVisible();
    await page.unroute(quizListPattern);
    await page.getByRole("button", { name: "Try quiz list again" }).click();
    await expect(quizCollection).toContainText("Phase 14 quiz");
  }

  await page.getByRole("tab", { name: "Original PDF" }).click();
  await expect(page.getByTitle(`Original PDF: ${title}`)).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await page.getByRole("tab", { name: "Extracted Content" }).click();
  await expect(page.getByText("Synthetic provider-free learning content."))
    .toBeVisible();
  await expect(page.getByText("5 words")).toBeVisible();
  if (project === "desktop") {
    await capture(page, "ui-la1-document-viewer-extracted.png");
  }

  await page.getByRole("button", { name: "Delete document" }).click();
  await expect(
    page.getByRole("heading", { name: "Permanently delete document" }),
  ).toBeVisible();
  if (project === "desktop") {
    await capture(page, "ui-la1-document-deletion-dialog.png");
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Delete document" }))
    .toBeFocused();

  await page.getByRole("tab", { name: "Grounded Chat" }).click();
  await expect(page.getByRole("article", { name: "Phase 14 grounded chat" }))
    .toContainText("2 messages");
  if (project === "desktop") {
    await capture(page, "ui-la1-conversation-collection.png");
  }
  await page
    .getByRole("link", { name: /Phase 14 grounded chat/ })
    .click();
  await expect(page.getByText("Stored synthetic answer")).toBeVisible();
  await expect(page.getByRole("list", { name: "Conversation history" }))
    .toBeVisible();
  await expect(
    page.getByRole("group", { name: "Sources for assistant answer" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Page 1" }).click();
  await expect(page.getByText(/Page 1 is a validated reference/))
    .toBeVisible();
  if (project === "desktop") {
    await capture(page, "ui-la1-grounded-conversation-citations.png");
  } else if (project === "mobile") {
    await capture(page, "ui-la1-mobile-conversation.png");
  }

  const messagePattern =
    "**/api/v1/learning-documents/*/conversations/*/messages";
  if (project === "desktop") {
    let abortNextMessage = true;
    await page.route(messagePattern, async (route) => {
      if (abortNextMessage && route.request().method() === "POST") {
        abortNextMessage = false;
        await route.abort();
        return;
      }
      await route.continue();
    });
  }
  await page.getByRole("textbox", { name: "Question" }).fill(
    "What is the provider-free state?",
  );
  await page.getByRole("button", { name: "Send question" }).click();
  if (project === "desktop") {
    await expect(
      page.getByRole("button", { name: "Retry same question" }),
    ).toBeVisible();
    await capture(page, "ui-la1-chat-sending-failure-retry.png");
    await page.getByRole("button", { name: "Retry same question" }).click();
    await page.unroute(messagePattern);
  }
  await expect(page.getByRole("status")).toContainText(/queued|paused/i);

  await phase14.openRoute(
    page,
    `/learning/documents/${records.documentId}/flashcards/${records.flashcardSetId}`,
  );
  await expect(
    page.getByRole("heading", { name: "Phase 14 flashcards" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Flashcard answer" }),
  ).toHaveCount(0);
  await expect(page.getByText("Beginning of set")).toBeVisible();
  if (project === "desktop") {
    await capture(page, "ui-la2-flashcard-study-front.png");
  } else if (project === "mobile") {
    await capture(page, "ui-la2-mobile-flashcard-study.png");
  }
  const revealAnswer = page.getByRole("button", { name: "Reveal answer" });
  await revealAnswer.focus();
  await expect(revealAnswer).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Stored synthetic back")).toBeVisible();
  await expect(page.getByRole("button", { name: "Page 1" })).toBeVisible();
  await page.getByRole("button", { name: "Page 1" }).click();
  await expect(page.getByText(/Page 1 is a validated reference/))
    .toBeVisible();
  if (project === "desktop") {
    await capture(page, "ui-la2-flashcard-study-answer.png");
  }
  const hideAnswer = page.getByRole("button", { name: "Hide answer" });
  await hideAnswer.focus();
  await page.keyboard.press("Space");
  await expect(page.getByText("Stored synthetic back")).toHaveCount(0);
  await revealAnswer.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Next flashcard" }).click();
  await expect(page.getByText("End of set")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next flashcard" }),
  ).toBeDisabled();

  await phase14.openRoute(
    page,
    `/learning/documents/${records.documentId}/quizzes/${records.quizId}`,
  );
  await expect(page.getByText("Which state is safe?")).toBeVisible();
  await expect(page.getByText("Stored explanation")).toHaveCount(0);
  await expect(page.getByText(/correct answer/i)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Page 1" }),
  ).toHaveCount(0);
  const safeChoice = page.getByRole("radio", {
    name: "Unavailable without disclosure",
  });
  await safeChoice.focus();
  await page.keyboard.press("Space");
  await expect(safeChoice).toBeChecked();
  await expect(page.getByText("Selected", { exact: true })).toBeVisible();
  if (project === "desktop") {
    await capture(page, "ui-la2-quiz-taking-selected-secret.png");
  }
  await page.getByRole("button", { name: "Submit quiz answers" }).click();
  await expect(page).toHaveURL(/\/attempts\//);
  await expect(page.getByText("Stored explanation")).toBeVisible();
  const serverResult = page.getByRole("region", {
    name: "Server-authoritative quiz result",
  });
  await expect(serverResult).toContainText("100%");
  await expect(serverResult).toContainText("1 of 1 correct");
  await expect(page.getByText("Correct", { exact: true })).toBeVisible();
  await expect(page.getByText("Selected answer")).toBeVisible();
  await expect(page.getByText("Correct answer")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Review source page 1" }),
  ).toBeVisible();
  if (project === "desktop") {
    await captureElement(
      serverResult,
      "ui-la2-quiz-result-summary.png",
    );
    await captureElement(
      page.locator(".learning-review-question"),
      "ui-la2-quiz-answer-review.png",
    );
  }

  await page.getByRole("link", { name: "Quiz workspace" }).click();
  await expect(page.getByRole("heading", { name: "Attempt history" }))
    .toBeVisible();
  await expect(page.getByText("Server score")).toBeVisible();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await phase14.openRoute(page, "/learning");
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const transitionDuration = await documentCard.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(transitionDuration).toMatch(/0\.00001s|1e-05s|0s/);

  if (project === "desktop") {
    await page.setViewportSize({ width: 1024, height: 768 });
    await phase14.expectPageHealth(page);
    await page.setViewportSize({ width: 320, height: 720 });
    await phase14.expectPageHealth(page);
  }
  await phase14.expectPageHealth(page);
  expect([...new Set(nonLocalRequests)]).toEqual([]);
});
