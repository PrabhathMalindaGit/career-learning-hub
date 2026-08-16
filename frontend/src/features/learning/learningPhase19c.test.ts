import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(file: string): string {
  return readFileSync(
    resolve(process.cwd(), `src/features/learning/${file}`),
    "utf8",
  );
}

describe("Phase 19C Learning Workspace contracts", () => {
  it("keeps the library focused on one upload action with refresh beside library controls", () => {
    const dashboard = source("LearningDashboard.tsx");

    expect(dashboard.match(/>\s*Upload PDF\s*</g)).toHaveLength(1);
    expect(dashboard).toContain("learning-library-toolbar-actions");
    expect(dashboard).toContain("Refresh documents");
    expect(dashboard).not.toContain("server validation remains authoritative");
  });

  it("keeps saved study material ahead of bounded creation panels", () => {
    const flashcards = source("DocumentFlashcards.tsx");
    const quizzes = source("DocumentQuizzes.tsx");

    expect(
      flashcards.indexOf('className="learning-flashcard-set-list"'),
    ).toBeLessThan(
      flashcards.indexOf('id="learning-flashcard-generation"'),
    );
    expect(
      quizzes.indexOf('className="learning-quiz-set-list"'),
    ).toBeLessThan(
      quizzes.indexOf('id="learning-quiz-generation"'),
    );
    expect(flashcards).toContain("Document-based flashcards");
    expect(quizzes).toContain("Document-based quiz");
  });

  it("uses user-facing result and source language instead of implementation labels", () => {
    const quizWorkspace = source("LearningQuizWorkspace.tsx");
    const attemptWorkspace = source("LearningQuizAttemptWorkspace.tsx");
    const flashcardStudy = source("FlashcardStudy.tsx");

    for (const text of [quizWorkspace, attemptWorkspace, flashcardStudy]) {
      expect(text).not.toContain("Canonical Server Result");
      expect(text).not.toContain("Immutable Record");
      expect(text).not.toContain("Grounded Assessment");
      expect(text).not.toContain("Grounded Recall");
    }
    expect(attemptWorkspace).toContain("Official results");
    expect(attemptWorkspace).toContain("Verified sources");
    expect(attemptWorkspace).toContain("View Page");
    expect(flashcardStudy).toContain("View Page");
  });

  it("keeps narrow six-tab navigation scrollable and the active tab visually anchored", () => {
    const baseCss = source("learningWorkspace.css");
    const phaseCss = source("learningPhase19c.css");

    expect(baseCss).toMatch(
      /@media \(max-width: 700px\)[\s\S]*\.learning-tabs[\s\S]*overflow-x: auto/,
    );
    expect(phaseCss).toContain("scroll-snap-type: inline proximity");
    expect(phaseCss).toContain("scroll-snap-align: center");
    expect(phaseCss).toContain('.learning-tabs button[aria-selected="true"]');
  });

  it("uses the modern provider-job treatment with the product green palette for Learning AI status surfaces", () => {
    const phaseCss = source("learningPhase19c.css");

    expect(phaseCss).toContain(".job-resilience-actions__progress");
    expect(phaseCss).toContain(
      ".learning-response-status:has(.job-resilience-actions)",
    );
    expect(phaseCss).toContain("accent-color: var(--accent)");
    expect(phaseCss).toContain("background: #f4f8f5");
    expect(phaseCss).not.toContain("#6553b8");
    expect(phaseCss).not.toContain("#f7f5ff");
    expect(phaseCss).toContain(
      ".learning-response-status .job-resilience-actions__buttons button",
    );
    expect(phaseCss).toMatch(
      /\.job-resilience-actions__progress\s*\{[\s\S]*?display:\s*none;/,
    );
    expect(phaseCss).toMatch(
      /\.learning-response-status \.job-resilience-actions__progress\s*\{[\s\S]*?display:\s*block;/,
    );
  });

  it("keeps child deletion in compact overflow controls without displacing primary study actions", () => {
    const conversations = source("DocumentConversations.tsx");
    const flashcards = source("DocumentFlashcards.tsx");
    const quizzes = source("DocumentQuizzes.tsx");
    const phaseCss = source("learningPhase19c.css");

    expect(conversations).toContain("learning-conversation-card-actions");
    expect(conversations).toContain('kind="conversation"');
    expect(flashcards).toContain('kind="flashcard-set"');
    expect(flashcards).toContain('disabled={set.status === "generating"}');
    expect(quizzes).toContain('kind="quiz"');
    expect(quizzes).toContain('disabled={quiz.status === "generating"}');
    expect(phaseCss).toContain(".learning-conversation-card-actions");
    expect(phaseCss).toContain(
      ".learning-collection-card-heading > .learning-child-deletion",
    );
    expect(phaseCss).toMatch(
      /@media \(max-width: 700px\)[\s\S]*\.learning-conversation-card-actions/,
    );
  });

  it("keeps user and assistant chat messages distinct with sources attached inside messages", () => {
    const conversation = source("LearningConversationWorkspace.tsx");

    expect(conversation).toContain("learning-message--${message.role}");
    expect(conversation).toContain('message.role === "user" ? "You" : "Assistant"');
    expect(conversation).toContain("message.sourcePages.length > 0");
    expect(conversation).toContain("learning-source-pages");
  });
});
