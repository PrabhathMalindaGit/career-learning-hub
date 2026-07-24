import { readFile } from "node:fs/promises";
import { afterAll, afterEach } from "vitest";

const environmentFile =
  process.env.CAREER_HUB_TEST_ENV_FILE;

if (!environmentFile) {
  throw new Error(
    "Vitest global setup did not provide the runtime environment.",
  );
}

const runtimeEnvironment = JSON.parse(
  await readFile(environmentFile, "utf8"),
) as NodeJS.ProcessEnv;

Object.assign(process.env, runtimeEnvironment);

const mongoose = (await import("mongoose")).default;

if (mongoose.connection.readyState === 0) {
  await mongoose.connect(process.env.MONGODB_URI!, {
    autoIndex: true,
    autoCreate: true,
  });
}

const storage = await import(
  "../modules/assets/storage/storage.factory.js"
);
await storage.initializePrivateStorage();

const readiness = await import(
  "../modules/health/runtimeReadiness.js"
);
readiness.markStorageReady();
readiness.markJobSystemReady();

afterEach(async () => {
  await Promise.all(
    Object.values(
      mongoose.connection.collections,
    ).map((collection) =>
      collection.deleteMany({}),
    ),
  );
});


afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});
