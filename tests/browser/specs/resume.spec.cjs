const { expect, test } = require("../support/fixtures.cjs");

function pdfPageCount(buffer) {
  return (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? [])
    .length;
}

test("@smoke creates, edits, versions, validates, and guards a Resume", async ({
  page,
  phase14,
}) => {
  const unexpectedExportRequests = [];
  page.on("request", (request) => {
    if (/\/(?:export|pdf)(?:\/|$|\?)/i.test(request.url())) {
      unexpectedExportRequests.push(request.url());
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
