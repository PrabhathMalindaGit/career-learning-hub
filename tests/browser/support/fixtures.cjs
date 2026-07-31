const { randomBytes, randomUUID } = require("node:crypto");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { expect, test: base } = require("playwright/test");

const runtimeFile =
  "/private/tmp/career-learning-hub-phase14/runtime/runtime.json";

async function runtime() {
  return JSON.parse(await readFile(runtimeFile, "utf8"));
}

async function connection() {
  const { mongoUri } = await runtime();
  return mongoose.createConnection(mongoUri).asPromise();
}

function identity(label) {
  const suffix = `${Date.now()}-${randomBytes(5).toString("hex")}`;
  return {
    displayName: `Phase 14 ${label}`,
    email: `phase14-${label}-${suffix}@example.test`,
    password: `Aa1!${randomBytes(12).toString("hex")}`,
  };
}

async function cleanupUserIds(userIds) {
  if (userIds.length === 0) return;
  const db = await connection();
  try {
    const ids = userIds.map((value) => new mongoose.Types.ObjectId(value));
    for (const collection of Object.values(db.collections)) {
      if (collection.collectionName === "users") continue;
      await collection.deleteMany({
        $or: [
          { userId: { $in: ids } },
          { ownerId: { $in: ids } },
        ],
      });
    }
    await db.collection("users").deleteMany({ _id: { $in: ids } });
    const remainingUsers = await db
      .collection("users")
      .countDocuments({ _id: { $in: ids } });
    let remainingOwned = 0;
    for (const collection of Object.values(db.collections)) {
      if (collection.collectionName === "users") continue;
      remainingOwned += await collection.countDocuments({
        $or: [
          { userId: { $in: ids } },
          { ownerId: { $in: ids } },
        ],
      });
    }
    if (remainingUsers !== 0 || remainingOwned !== 0) {
      throw new Error(
        `Synthetic cleanup left ${remainingUsers} users and ${remainingOwned} owned records.`,
      );
    }
  } finally {
    await db.close();
  }
}

async function cleanupTagged() {
  const db = await connection();
  try {
    const users = await db
      .collection("users")
      .find({ email: /^phase14-.*@example\.test$/ })
      .project({ _id: 1 })
      .toArray();
    const ids = users.map((user) => user._id);
    if (ids.length > 0) {
      for (const collection of Object.values(db.collections)) {
        if (collection.collectionName === "users") continue;
        await collection.deleteMany({
          $or: [
            { userId: { $in: ids } },
            { ownerId: { $in: ids } },
          ],
        });
      }
      await db.collection("users").deleteMany({ _id: { $in: ids } });
    }
    let owned = 0;
    for (const collection of Object.values(db.collections)) {
      if (collection.collectionName === "users") continue;
      owned += await collection.countDocuments({
        $or: [
          { userId: { $in: ids } },
          { ownerId: { $in: ids } },
        ],
      });
    }
    const taggedUsers = await db
      .collection("users")
      .countDocuments({ email: /^phase14-.*@example\.test$/ });
    return { taggedUsers, ownedRecords: owned };
  } finally {
    await db.close();
  }
}

async function seedDashboard(user) {
  const db = await connection();
  try {
    const userId = new mongoose.Types.ObjectId(user.id);
    const now = new Date();
    const prior = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
    const resumeId = new mongoose.Types.ObjectId();
    const resumeVersionId = new mongoose.Types.ObjectId();
    const priorResumeVersionId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId();
    const completedSessionId = new mongoose.Types.ObjectId();
    const questionId = new mongoose.Types.ObjectId();
    const documentId = new mongoose.Types.ObjectId();
    const quizId = new mongoose.Types.ObjectId();
    const targetRole =
      "Platform reliability and distributed systems engineering specialist for a deliberately long synthetic role";

    await Promise.all([
      db.collection("resumes").insertOne({
        _id: resumeId,
        userId,
        title: "Synthetic platform Resume",
        status: "draft",
        currentVersionId: resumeVersionId,
        latestVersionNumber: 2,
        createdAt: prior,
        updatedAt: now,
      }),
      db.collection("resumeversions").insertMany([
        {
          _id: priorResumeVersionId,
          userId,
          resumeId,
          versionNumber: 1,
          source: "manual",
          content: blankResumeContent(),
          createdAt: prior,
          updatedAt: prior,
        },
        {
          _id: resumeVersionId,
          userId,
          resumeId,
          versionNumber: 2,
          source: "manual",
          content: blankResumeContent(),
          createdAt: now,
          updatedAt: now,
        },
      ]),
      db.collection("resumeanalyses").insertMany([
        {
          userId,
          resumeId,
          resumeVersionId: priorResumeVersionId,
          target: { role: targetRole },
          scoreBreakdown: {
            keywordMatch: 18,
            clarity: 20,
            evidence: 19,
            formatting: 20,
          },
          totalScore: 77,
          createdAt: prior,
          updatedAt: prior,
        },
        {
          userId,
          resumeId,
          resumeVersionId,
          target: { role: targetRole },
          scoreBreakdown: {
            keywordMatch: 21,
            clarity: 22,
            evidence: 20,
            formatting: 21,
          },
          totalScore: 84,
          createdAt: now,
          updatedAt: now,
        },
      ]),
      db.collection("interviewsessions").insertMany([
        {
          _id: sessionId,
          userId,
          title: "Synthetic platform interview",
          targetRole: "Platform engineer",
          status: "active",
          createdAt: prior,
          updatedAt: now,
        },
        {
          _id: completedSessionId,
          userId,
          title: "Synthetic completed interview",
          targetRole: "Platform engineer",
          status: "completed",
          createdAt: prior,
          updatedAt: now,
        },
      ]),
      db.collection("interviewattempts").insertOne({
        userId,
        sessionId: completedSessionId,
        questionId,
        answerText: "Synthetic interview answer.",
        status: "feedback-completed",
        feedback: {
          score: 82,
          completedAt: now,
        },
        createdAt: now,
        updatedAt: now,
      }),
      db.collection("learningdocuments").insertOne({
        _id: documentId,
        userId,
        assetId: new mongoose.Types.ObjectId(),
        title:
          "Synthetic distributed systems notes with a deliberately long title for responsive wrapping verification",
        originalFilename: "synthetic-learning.pdf",
        mimeType: "application/pdf",
        status: "ready",
        pageCount: 12,
        chunkCount: 24,
        processedAt: now,
        createdAt: prior,
        updatedAt: now,
      }),
      db.collection("quizattempts").insertOne({
        userId,
        documentId,
        quizId,
        answers: [],
        correctCount: 8,
        questionCount: 10,
        scorePercent: 80,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      }),
      db.collection("usageevents").insertMany([
        {
          userId,
          feature:
            "resume-analysis-with-a-deliberately-long-synthetic-feature-label",
          provider: "synthetic-disabled",
          model: "synthetic-disabled",
          requestCount: 1,
          inputTokens: 800,
          outputTokens: 200,
          estimatedCostUsd: 0.01,
          status: "success",
          latencyMs: 640,
          createdAt: now,
          updatedAt: now,
        },
        {
          userId,
          feature: "interview-feedback",
          provider: "synthetic-disabled",
          model: "synthetic-disabled",
          requestCount: 1,
          inputTokens: 500,
          outputTokens: 150,
          status: "failure",
          latencyMs: 920,
          createdAt: now,
          updatedAt: now,
        },
      ]),
      db.collection("activityevents").insertMany(
        Array.from({ length: 25 }, (_, index) => ({
          userId,
          type: "quiz.completed",
          resourceType: "quiz-attempt",
          resourceId: `phase14-${index + 1}`,
          origin: "api",
          metadata: {},
          occurredAt: new Date(now.getTime() - index * 1_000),
          createdAt: new Date(now.getTime() - index * 1_000),
          updatedAt: new Date(now.getTime() - index * 1_000),
        })),
      ),
    ]);
  } finally {
    await db.close();
  }
}

async function promoteLearningDocument(user, title) {
  const db = await connection();
  try {
    const userId = new mongoose.Types.ObjectId(user.id);
    const document = await db
      .collection("learningdocuments")
      .findOne({ userId, title });
    if (!document) throw new Error("Uploaded synthetic document was not found.");
    const now = new Date();
    await db.collection("learningdocuments").updateOne(
      { _id: document._id },
      {
        $set: {
          status: "ready",
          pageCount: 1,
          chunkCount: 1,
          summary: "Synthetic Phase 14 source summary.",
          summaryKeyPoints: ["Private source remains user-owned."],
          processedAt: now,
          updatedAt: now,
        },
        $unset: { processingError: "", processingJobId: "" },
      },
    );
    const chunkId = new mongoose.Types.ObjectId();
    await db.collection("documentchunks").insertOne({
      _id: chunkId,
      userId,
      documentId: document._id,
      chunkIndex: 0,
      pageStart: 1,
      pageEnd: 1,
      text: "Synthetic provider-free learning content.",
      wordCount: 5,
      createdAt: now,
      updatedAt: now,
    });
    const conversationId = new mongoose.Types.ObjectId();
    await db.collection("conversations").insertOne({
      _id: conversationId,
      userId,
      documentId: document._id,
      title: "Phase 14 grounded chat",
      messageCount: 2,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const userMessageId = new mongoose.Types.ObjectId();
    await db.collection("messages").insertMany([
      {
        _id: userMessageId,
        userId,
        documentId: document._id,
        conversationId,
        role: "user",
        content: "What is stored?",
        sourceChunkIds: [],
        sourcePages: [],
        createdAt: new Date(now.getTime() - 1_000),
        updatedAt: new Date(now.getTime() - 1_000),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        userId,
        documentId: document._id,
        conversationId,
        role: "assistant",
        content: "Stored synthetic answer",
        replyToMessageId: userMessageId,
        sourceChunkIds: [chunkId],
        sourcePages: [1],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const flashcardSetId = new mongoose.Types.ObjectId();
    await db.collection("flashcardsets").insertOne({
      _id: flashcardSetId,
      userId,
      documentId: document._id,
      requestId: randomUUID(),
      title: "Phase 14 flashcards",
      status: "ready",
      cardCount: 2,
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("flashcards").insertMany([
      {
        userId,
        documentId: document._id,
        setId: flashcardSetId,
        cardIndex: 0,
        front: "Stored synthetic front",
        back: "Stored synthetic back",
        sourceChunkIds: [chunkId],
        sourcePages: [1],
        createdAt: now,
        updatedAt: now,
      },
      {
        userId,
        documentId: document._id,
        setId: flashcardSetId,
        cardIndex: 1,
        front: "Second synthetic front",
        back: "Second synthetic back",
        sourceChunkIds: [chunkId],
        sourcePages: [1],
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const quizId = new mongoose.Types.ObjectId();
    await db.collection("quizzes").insertOne({
      _id: quizId,
      userId,
      documentId: document._id,
      requestId: randomUUID(),
      title: "Phase 14 quiz",
      status: "ready",
      questionCount: 1,
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("quizquestions").insertOne({
      userId,
      documentId: document._id,
      quizId,
      questionIndex: 0,
      prompt: "Which state is safe?",
      choices: ["Unavailable without disclosure", "Expose private records"],
      correctChoiceIndex: 0,
      explanation: "Stored explanation",
      sourceChunkIds: [chunkId],
      sourcePages: [1],
      createdAt: now,
      updatedAt: now,
    });
    return {
      documentId: String(document._id),
      conversationId: String(conversationId),
      flashcardSetId: String(flashcardSetId),
      quizId: String(quizId),
    };
  } finally {
    await db.close();
  }
}

function blankResumeContent() {
  return {
    basics: { fullName: "Private Candidate", links: [] },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

async function seedOwnershipResources(user) {
  const db = await connection();
  try {
    const userId = new mongoose.Types.ObjectId(user.id);
    const now = new Date();
    const privateTitle = `Private ${randomBytes(4).toString("hex")}`;
    const privateContent = "Owner A private synthetic content";
    const resumeId = new mongoose.Types.ObjectId();
    const versionId = new mongoose.Types.ObjectId();
    await db.collection("resumes").insertOne({
      _id: resumeId,
      userId,
      title: privateTitle,
      status: "draft",
      currentVersionId: versionId,
      latestVersionNumber: 1,
      design: {
        templateId: "ats-classic",
        colorPaletteId: "slate",
        pageSize: "A4",
        fontFamily: "Inter",
        showProfilePhoto: false,
      },
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("resumeversions").insertOne({
      _id: versionId,
      userId,
      resumeId,
      versionNumber: 1,
      source: "manual",
      content: blankResumeContent(),
      createdAt: now,
      updatedAt: now,
    });
    const interviewSessionId = new mongoose.Types.ObjectId();
    await db.collection("interviewsessions").insertOne({
      _id: interviewSessionId,
      userId,
      title: privateTitle,
      targetRole: "Private role",
      experienceLevel: "Senior",
      focusTopics: [],
      skillGaps: [],
      mode: "written-practice",
      status: "active",
      questionCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    const assetId = new mongoose.Types.ObjectId();
    const documentId = new mongoose.Types.ObjectId();
    await db.collection("assets").insertOne({
      _id: assetId,
      userId,
      purpose: "learning-document",
      storageProvider: "local",
      storageKey: `phase14/${assetId}.pdf`,
      originalFilename: "synthetic-learning.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1,
      checksumSha256: "0".repeat(64),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("learningdocuments").insertOne({
      _id: documentId,
      userId,
      assetId,
      title: privateTitle,
      originalFilename: "synthetic-learning.pdf",
      mimeType: "application/pdf",
      status: "ready",
      pageCount: 1,
      chunkCount: 0,
      summary: privateContent,
      summaryKeyPoints: [],
      workFence: 0,
      processedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const conversationId = new mongoose.Types.ObjectId();
    await db.collection("conversations").insertOne({
      _id: conversationId,
      userId,
      documentId,
      title: privateTitle,
      messageCount: 1,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("messages").insertOne({
      userId,
      documentId,
      conversationId,
      role: "assistant",
      content: privateContent,
      sourceChunkIds: [],
      sourcePages: [],
      createdAt: now,
      updatedAt: now,
    });
    const flashcardSetId = new mongoose.Types.ObjectId();
    await db.collection("flashcardsets").insertOne({
      _id: flashcardSetId,
      userId,
      documentId,
      requestId: randomUUID(),
      title: privateTitle,
      status: "ready",
      cardCount: 1,
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("flashcards").insertOne({
      userId,
      documentId,
      setId: flashcardSetId,
      cardIndex: 0,
      front: privateContent,
      back: privateContent,
      sourceChunkIds: [],
      sourcePages: [],
      createdAt: now,
      updatedAt: now,
    });
    const quizId = new mongoose.Types.ObjectId();
    const questionId = new mongoose.Types.ObjectId();
    await db.collection("quizzes").insertOne({
      _id: quizId,
      userId,
      documentId,
      requestId: randomUUID(),
      title: privateTitle,
      status: "ready",
      questionCount: 1,
      createdAt: now,
      updatedAt: now,
    });
    await db.collection("quizquestions").insertOne({
      _id: questionId,
      userId,
      documentId,
      quizId,
      questionIndex: 0,
      prompt: privateContent,
      choices: ["Private choice", "Neutral choice"],
      correctChoiceIndex: 1,
      explanation: privateContent,
      sourceChunkIds: [],
      sourcePages: [],
      createdAt: now,
      updatedAt: now,
    });
    const quizAttemptId = new mongoose.Types.ObjectId();
    await db.collection("quizattempts").insertOne({
      _id: quizAttemptId,
      userId,
      documentId,
      quizId,
      answers: [
        {
          questionId,
          questionIndex: 0,
          selectedChoiceIndex: 1,
          correct: true,
        },
      ],
      correctCount: 1,
      questionCount: 1,
      scorePercent: 100,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return {
      privateTitle,
      privateContent,
      resumeId: String(resumeId),
      interviewSessionId: String(interviewSessionId),
      documentId: String(documentId),
      conversationId: String(conversationId),
      flashcardSetId: String(flashcardSetId),
      quizId: String(quizId),
      quizAttemptId: String(quizAttemptId),
    };
  } finally {
    await db.close();
  }
}

const test = base.extend({
  phase14: async ({ page }, use, testInfo) => {
    const userIds = [];
    const browserIssues = [];
    page.on("console", (message) => {
      const browserNetworkDiagnostic = message.text().startsWith(
        "Failed to load resource:",
      );
      if (
        !browserNetworkDiagnostic &&
        (message.type() === "warning" || message.type() === "error")
      ) {
        browserIssues.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      browserIssues.push(`pageerror: ${error.message}`);
    });

    const helper = {
      identity,
      title(label) {
        return `Phase 14 ${label} ${randomBytes(4).toString("hex")}`;
      },
      async createUser(label) {
        const next = identity(label);
        const db = await connection();
        let userId;
        try {
          const now = new Date();
          const result = await db.collection("users").insertOne({
            email: next.email,
            passwordHash: await bcrypt.hash(next.password, 10),
            profile: {
              displayName: next.displayName,
            },
            roles: ["user"],
            accountStatus: "active",
            createdAt: now,
            updatedAt: now,
          });
          userId = String(result.insertedId);
        } finally {
          await db.close();
        }
        const user = {
          ...next,
          id: userId,
        };
        userIds.push(user.id);
        return user;
      },
      async trackRegistered(email) {
        const db = await connection();
        try {
          const user = await db.collection("users").findOne({ email });
          if (!user) throw new Error("Registered synthetic user was not found.");
          userIds.push(String(user._id));
        } finally {
          await db.close();
        }
      },
      async fillLogin(targetPage, user) {
        await targetPage
          .getByRole("textbox", { name: "Email address" })
          .fill(user.email);
        await targetPage.getByLabel("Password").fill(user.password);
        await targetPage.getByRole("button", { name: "Sign in" }).click();
      },
      async login(targetPage, user) {
        await targetPage.goto("/login");
        await this.fillLogin(targetPage, user);
        await expect(targetPage).toHaveURL(/\/dashboard$/);
      },
      async openRoute(targetPage, route) {
        await targetPage.evaluate((nextRoute) => {
          window.history.pushState({}, "", nextRoute);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }, route);
        await expect(targetPage).toHaveURL(route);
      },
      async navigate(targetPage, label) {
        if ((targetPage.viewportSize()?.width ?? 1440) < 980) {
          if (label === "Dashboard") {
            await targetPage
              .getByRole("link", { name: "Career Learning Hub" })
              .click();
            return;
          }
          const toggle = targetPage.getByRole("button", {
            name: "Toggle navigation",
          });
          await toggle.click();
          await expect(toggle).toHaveAttribute("aria-expanded", "true");
          await targetPage
            .getByRole("navigation", { name: "Mobile navigation" })
            .getByRole("link", { name: label })
            .click();
          return;
        }
        await targetPage
          .getByRole("navigation", { name: "Primary navigation" })
          .getByRole("link", { name: label })
          .click();
      },
      async expectPageHealth(targetPage) {
        await expect(targetPage.getByRole("main")).toBeVisible();
        const overflow = await targetPage.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);
      },
      seedDashboard,
      promoteLearningDocument,
      seedOwnershipResources,
    };

    await use(helper);
    await cleanupUserIds(userIds);
    expect(
      browserIssues,
      `Browser console/page errors in ${testInfo.title}`,
    ).toEqual([]);
  },
});

module.exports = {
  cleanupTagged,
  expect,
  test,
};
