# Phase 8 — Existing User Data Migration

Phase 8 adds a resumable, ID-mapped migration framework for importing
exported records from the four original projects into the unified Career &
Learning Hub database.

The archive contains migration code only. No user records were migrated
because source database exports and target database credentials were not
supplied.

## Migration scope

| Source project | Imported data |
|---|---|
| AI Learning Assistant | Users, learning-document containers, flashcard sets, flashcards, quizzes, and quiz questions |
| AI Resume Analyser | Users, canonical Resumes, and ResumeVersions |
| Interview Prep AI | Users, InterviewSessions, and InterviewQuestions |
| Resume Builder | Users, canonical Resumes, and ResumeVersions |

Historical interview attempts, resume-analysis reports, conversations,
uploaded source files, and quiz attempts are outside this requested Phase 8
scope. They can be added as later modular migrations without changing the
existing mapping framework.

## Generated migration files

```text
backend/src/migrations/
├── cli.ts
├── migration.manifest.ts
├── migration.runner.ts
├── migration.types.ts
├── migration.utils.ts
├── migration.lookup.ts
├── migrationMap.model.ts
├── migrationRun.model.ts
├── resumeMigration.adapter.ts
├── migrateUsers.ts
├── migrateResumes.ts
├── migrateInterviews.ts
├── migrateLearning.ts
└── examples/
    └── migration-manifest.example.json
```

## MigrationMap

`MigrationMap` permanently records the relationship between a legacy
record and its unified target record:

```text
sourceProject
entityType
legacyId
targetModel
targetId
sourceChecksum
runId
metadata
migratedAt
```

The following compound index makes each source entity idempotent:

```text
{ sourceProject: 1, entityType: 1, legacyId: 1 }
```

A mapped source record cannot silently point to another target. A rerun
with a changed source checksum is blocked until the existing mapping is
explicitly investigated and reconciled.

## Input formats

Each export file may be:

- a JSON array;
- MongoDB Extended JSON;
- NDJSON or JSONL;
- an object containing one of the common array keys, such as `records`,
  `data`, `users`, `resumes`, `questions`, or `quizzes`.

The import reader supports common MongoDB values such as:

```json
{
  "_id": { "$oid": "..." },
  "createdAt": { "$date": "2026-01-01T00:00:00.000Z" }
}
```

Files are limited to 512 MB each. Split larger exports before migration.

## Prepare the source exports

Create a private directory outside source control:

```text
migration-input/
├── ai-learning-assistant/
├── ai-resume-analyser/
├── interview-prep-ai/
└── resume-builder/
```

The project `.gitignore` excludes both:

```text
migration-input/
migration-reports/
```

Never place production exports in Git.

MongoDB exports can be created with `mongoexport`, MongoDB Compass, or a
controlled export script. Preserve original `_id`, ownership fields,
timestamps, and embedded arrays.

## Create the manifest

Copy:

```text
backend/src/migrations/examples/migration-manifest.example.json
```

to a private working location, then update the paths.

Example:

```json
{
  "version": 1,
  "inputRoot": "./migration-input",
  "projects": {
    "ai-learning-assistant": {
      "users": "ai-learning-assistant/users.json",
      "learningDocuments": "ai-learning-assistant/documents.json",
      "flashcardSets": "ai-learning-assistant/flashcard-sets.json",
      "flashcards": "ai-learning-assistant/flashcards.json",
      "quizzes": "ai-learning-assistant/quizzes.json"
    },
    "ai-resume-analyser": {
      "users": "ai-resume-analyser/users.json",
      "resumes": "ai-resume-analyser/resumes.json"
    },
    "interview-prep-ai": {
      "users": "interview-prep-ai/users.json",
      "interviewSessions": "interview-prep-ai/sessions.json",
      "interviewQuestions": "interview-prep-ai/questions.json"
    },
    "resume-builder": {
      "users": "resume-builder/users.json",
      "resumes": "resume-builder/resumes.json"
    }
  }
}
```

Omit keys for data that does not exist.

## Environment preparation

Install dependencies and create the normal API environment:

```bash
npm install
cp backend/.env.example backend/.env
```

The migration CLI uses the existing API environment validation. Configure
the complete API `.env`, including `MONGODB_URI` and the existing required
security secrets.

Dry-run and execute modes connect to the target database. The target must
be MongoDB Atlas, a replica set, or a sharded cluster because execution
uses transactions.

Back up the target database before execute mode.

## Required three-stage workflow

### 1. Structural validation

Validation reads and normalizes the exports without writing to MongoDB:

```bash
npm run migrate:validate --       --manifest=/absolute/path/migration-manifest.json       --migration=all       --report-dir=/absolute/path/migration-reports
```

Available migration selections:

```text
users
resumes
interviews
learning
all
```

Running `all` is recommended because ownership mappings are staged in the
required order:

```text
Users → Resumes → Interviews → Learning
```

### 2. Database-aware dry run

Dry-run mode connects to the target, checks existing unified users and
mappings, validates transaction support, and calculates planned creates
and reuses. It does not insert, update, delete, or create migration
indexes.

```bash
npm run migrate:dry-run --       --manifest=/absolute/path/migration-manifest.json       --migration=all       --report-dir=/absolute/path/migration-reports
```

The resulting JSON report contains:

```text
manifestHash
sourceBundleHash
plannedCreates
plannedReuses
skipped
conflicts
warnings
errors
executionAllowed
```

`sourceBundleHash` covers the bytes of every configured source export.
Execute mode rejects the approval report if the manifest or any source
file changes after dry-run.

Review every warning and ensure:

```json
{
  "errors": 0,
  "executionAllowed": true
}
```

### 3. Approved execution

Pass the exact successful dry-run report:

```bash
npm run migrate:execute --       --manifest=/absolute/path/migration-manifest.json       --migration=all       --approved-report=/absolute/path/migration-reports/DRY_RUN_REPORT.json       --report-dir=/absolute/path/migration-reports
```

In production, execution also requires:

```bash
export MIGRATION_PRODUCTION_CONFIRMATION=I_UNDERSTAND
```

The `--skip-approved-report` option exists only for controlled recovery. It
bypasses a major safety control and should not be used for normal
migrations.

## User migration rules

`migrateUsers.ts`:

- normalizes emails with Unicode normalization, trimming, and lowercase;
- groups duplicate emails across all four projects;
- maps every legacy user ID in a duplicate group to one unified User;
- reuses an existing unified User with the normalized email;
- preserves a password only when exactly one compatible bcrypt hash exists;
- never imports plaintext passwords;
- installs a random, unknown reset-only password when hashes are missing or
  conflicting;
- records `passwordResetRequired` in MigrationMap metadata;
- preserves the earliest creation time and useful display name;
- reports redacted emails rather than full addresses.

Accounts marked `passwordResetRequired` need a controlled password-reset
process before the user can sign in.

## Resume migration rules

`migrateResumes.ts` imports Resume Builder and Resume Analyser records into
the canonical `Resume` and immutable `ResumeVersion` collections.

It:

- resolves ownership through MigrationMap;
- accepts common legacy aliases for personal details, employment,
  education, skills, projects, certifications, and languages;
- creates deterministic stable UUIDs for entries, links, and bullets;
- preserves source version order and timestamps when available;
- maps Resume Builder records as manual sources;
- maps Resume Analyser records as PDF-import sources unless the export
  provides a valid canonical source;
- reuses an existing mapped version or a matching version number on rerun;
- updates `currentVersionId` and `latestVersionNumber` transactionally.

Resume-analysis scores and AI suggestions are not imported by this phase.

## Interview migration rules

`migrateInterviews.ts`:

- imports explicit legacy sessions;
- groups standalone questions by legacy user and target role;
- creates one owned InterviewSession for each source session/group;
- normalizes difficulty, category, mode, notes, pinned state, model
  answers, and explanations;
- generates the same SHA-256 question fingerprints used by the live app;
- maps duplicate questions to the first matching target question;
- applies the unique `{ sessionId, questionFingerprint }` constraint;
- recalculates the stored session question count after idempotent upserts.

Historical answer attempts are not imported in this phase.

## Learning migration rules

`migrateLearning.ts` imports the old AI Learning Assistant flashcards and
quizzes into separate unified collections.

It:

- creates an owned LearningDocument container for each referenced legacy
  document;
- creates a deleted placeholder Asset when the original PDF file is not
  part of the export;
- imports embedded or separate flashcards into FlashcardSet and Flashcard;
- creates contiguous zero-based card indexes;
- imports embedded quiz questions into Quiz and QuizQuestion;
- converts text-based or index-based correct answers to
  `correctChoiceIndex`;
- rejects questions with missing prompts, duplicate choices, or invalid
  answer keys;
- creates contiguous zero-based quiz question indexes;
- keeps answer keys in the private QuizQuestion collection.

Placeholder assets preserve relational integrity but do not reconstruct
missing PDF bytes. Migrating actual source PDFs requires a separate,
checksum-verified asset-copy migration.

## Idempotency and recovery

The migration is resumable:

- deterministic target IDs are calculated from the manifest and legacy IDs;
- MigrationMap prevents duplicate target creation;
- source checksums detect changed records;
- each multi-document entity operation uses a MongoDB transaction;
- execution runs are persisted in `MigrationRun`;
- JSON reports are written for validate, dry-run, and execute modes.

Do not delete MigrationMap after a successful migration. It is the durable
audit trail and the basis for safe reruns.

When a source record legitimately changes after migration:

1. investigate the mapped target;
2. decide whether the target should be updated, replaced, or left intact;
3. back up both databases;
4. reconcile that one MigrationMap explicitly;
5. run validation and dry-run again.

## Verification after execution

Check the execute report and then verify:

1. Every imported legacy user ID has one MigrationMap.
2. Duplicate emails map to one User ID.
3. Users requiring resets cannot authenticate with legacy plaintext.
4. Every imported Resume has at least one ResumeVersion.
5. Resume version numbers are contiguous.
6. Every InterviewQuestion belongs to the same user as its session.
7. Session question counts match stored questions.
8. Every Flashcard belongs to its set, document, and user.
9. Every QuizQuestion belongs to its quiz, document, and user.
10. Quiz question indexes are unique and contiguous.
11. The unified dashboard shows only actual migrated records.
12. A second user's token cannot retrieve migrated data belonging to the
    first user.
