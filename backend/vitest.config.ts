import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./src/tests/globalSetup.ts"],
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/tests/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 60_000,
    hookTimeout: 180_000,
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/shared/scoring.ts",
        "src/shared/logger.ts",
        "src/modules/ai/aiOutputValidation.ts",
        "src/middleware/errorHandler.ts",
        "src/middleware/requestContext.ts",
        "src/middleware/rateLimit.ts",
        "src/modules/**/**Ownership.middleware.ts",
        "src/modules/resumes/resume.service.ts"
      ],
      exclude: [
        "src/tests/**",
        "src/migrations/**",
        "src/server.ts"
      ]
    }
  }
});
