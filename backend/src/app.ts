import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { corsOptions } from "./config/security.js";
import { jobRouter } from "./jobs/job.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import { apiRateLimiter } from "./middleware/rateLimit.js";
import { requestContextMiddleware } from "./middleware/requestContext.js";
import { activityRouter } from "./modules/activity/activity.routes.js";
import { aiRouter } from "./modules/ai/ai.routes.js";
import { assetRouter } from "./modules/assets/asset.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { interviewRouter } from "./modules/interviews/interview.routes.js";
import { flashcardSetRouter } from "./modules/learning/flashcard.routes.js";
import { learningDocumentRouter } from "./modules/learning/learningDocument.routes.js";
import { quizRouter } from "./modules/learning/quiz.routes.js";
import { dashboardRouter } from "./modules/progress/dashboard.routes.js";
import { resumeAnalysisRouter } from "./modules/resume-analysis/resumeAnalysis.routes.js";
import { resumeRouter } from "./modules/resumes/resume.routes.js";
import { userRouter } from "./modules/users/user.routes.js";

export const app = express();

app.disable("x-powered-by");
app.disable("etag");
app.set("json escape", true);
app.set(
  "trust proxy",
  env.TRUST_PROXY_HOPS === 0
    ? false
    : env.TRUST_PROXY_HOPS,
);

app.use(requestContextMiddleware);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    referrerPolicy: {
      policy: "no-referrer",
    },
    hsts: env.isProduction
      ? {
          maxAge: 31_536_000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  }),
);
app.use(cors(corsOptions));
app.use((_request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("Pragma", "no-cache");
  next();
});
// Readiness and liveness are intentionally outside the general API
// limiter so infrastructure checks cannot consume normal user capacity.
app.use("/api/v1/health", healthRouter);

// Apply abuse controls before parsing potentially expensive request bodies.
app.use("/api/v1", apiRateLimiter);
app.use(
  "/api/v1",
  express.json({ limit: "1mb", strict: true }),
);
app.use(
  "/api/v1",
  express.urlencoded({
    extended: false,
    limit: "1mb",
    parameterLimit: 100,
  }),
);
app.use("/api/v1", cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/assets", assetRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/activity", activityRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/resumes", resumeRouter);
app.use(
  "/api/v1/resume-analyses",
  resumeAnalysisRouter,
);
app.use(
  "/api/v1/interview-sessions",
  interviewRouter,
);
app.use(
  "/api/v1/learning-documents",
  learningDocumentRouter,
);
app.use("/api/v1/flashcard-sets", flashcardSetRouter);
app.use("/api/v1/quizzes", quizRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);
