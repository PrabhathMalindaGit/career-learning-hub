import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { sourceProjects } from "./migrationMap.model.js";

const sourceFilesSchema = z
  .object({
    users: z.string().min(1).optional(),
    resumes: z.string().min(1).optional(),
    interviewSessions: z.string().min(1).optional(),
    interviewQuestions: z.string().min(1).optional(),
    learningDocuments: z.string().min(1).optional(),
    flashcardSets: z.string().min(1).optional(),
    flashcards: z.string().min(1).optional(),
    quizzes: z.string().min(1).optional(),
  })
  .strict();

const manifestSchema = z
  .object({
    version: z.literal(1),
    inputRoot: z.string().min(1).default("."),
    projects: z
      .record(z.enum(sourceProjects), sourceFilesSchema)
      .default({}),
  })
  .strict();

export type MigrationManifest = z.infer<typeof manifestSchema>;
export type ProjectSourceFiles = z.infer<typeof sourceFilesSchema>;

export async function loadMigrationManifest(
  manifestPath: string,
): Promise<{
  manifest: MigrationManifest;
  absolutePath: string;
  inputRoot: string;
  raw: string;
}> {
  const absolutePath = resolve(manifestPath);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = manifestSchema.parse(JSON.parse(raw));

  return {
    manifest: parsed,
    absolutePath,
    inputRoot: resolve(dirname(absolutePath), parsed.inputRoot),
    raw,
  };
}


export async function hashMigrationSourceBundle(input: {
  manifest: MigrationManifest;
  inputRoot: string;
}): Promise<string> {
  const files = Object.entries(input.manifest.projects)
    .flatMap(([project, values]) =>
      Object.entries(values ?? {})
        .filter((entry): entry is [string, string] =>
          typeof entry[1] === "string",
        )
        .map(([key, relativePath]) => ({
          project,
          key,
          absolutePath: resolve(input.inputRoot, relativePath),
        })),
    )
    .sort((left, right) =>
      `${left.project}/${left.key}`.localeCompare(
        `${right.project}/${right.key}`,
      ),
    );

  const digest = createHash("sha256");

  for (const file of files) {
    digest.update(`${file.project}\u001f${file.key}\u001f`);

    await new Promise<void>((resolveStream, rejectStream) => {
      const stream = createReadStream(file.absolutePath);
      stream.on("data", (chunk) => digest.update(chunk));
      stream.on("end", resolveStream);
      stream.on("error", rejectStream);
    });

    digest.update("\u001e");
  }

  return digest.digest("hex");
}
