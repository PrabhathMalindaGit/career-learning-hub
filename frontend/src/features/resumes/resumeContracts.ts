import { ApiError } from "../../api/apiClient";
import { parseJobResilienceMetadata } from "../jobs/jobResilience";
import type {
  Pagination,
  ResumeAnalysis,
  ResumeContent,
  ResumeContentInput,
  ResumeDesign,
  ResumeImportPhotoCandidate,
  ResumeJob,
  ResumeListPageData,
  ResumeRecord,
  ResumeSource,
  ResumeStatus,
  ResumeVersion,
  ResumeVersionMetadata,
  ResumeVersionPageData,
  ResumeWorkspaceData,
} from "./types";

const objectIdPattern = /^[a-f\d]{24}$/i;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(): never {
  throw new ApiError(
    502,
    "INVALID_RESUME_RESPONSE",
    "The server returned an invalid resume response.",
  );
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalid();
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): Record<string, unknown> {
  const item = record(value);
  const allowed = new Set([...required, ...optional]);
  if (
    required.some((key) => !(key in item)) ||
    Object.keys(item).some((key) => !allowed.has(key))
  ) {
    invalid();
  }
  return item;
}

function array<T>(
  value: unknown,
  maximum: number,
  parse: (item: unknown) => T,
): T[] {
  if (!Array.isArray(value) || value.length > maximum) invalid();
  return value.map(parse);
}

function text(
  value: unknown,
  maximum: number,
  minimum = 0,
): string {
  if (
    typeof value !== "string" ||
    value.length < minimum ||
    value.length > maximum
  ) {
    invalid();
  }
  return value;
}

function optionalText(
  value: unknown,
  maximum: number,
): string | undefined {
  return value === undefined ? undefined : text(value, maximum);
}

function integer(
  value: unknown,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    invalid();
  }
  return value;
}

function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") invalid();
  return value;
}

function id(value: unknown): string {
  const parsed = text(value, 24, 24);
  if (!objectIdPattern.test(parsed)) invalid();
  return parsed;
}

function optionalId(value: unknown): string | undefined {
  return value === undefined || value === null ? undefined : id(value);
}

function uuid(value: unknown): string {
  const parsed = text(value, 36, 36);
  if (!uuidPattern.test(parsed)) invalid();
  return parsed;
}

function date(value: unknown): string {
  const parsed = text(value, 40, 20);
  if (
    Number.isNaN(Date.parse(parsed)) ||
    !/^\d{4}-\d{2}-\d{2}T/.test(parsed)
  ) {
    invalid();
  }
  return parsed;
}

function url(value: unknown): string {
  const parsed = text(value, 2_000, 1);
  try {
    new URL(parsed);
  } catch {
    invalid();
  }
  return parsed;
}

function source(value: unknown): ResumeSource {
  if (
    value !== "manual" &&
    value !== "pdf-import" &&
    value !== "ai-rewrite" &&
    value !== "duplicate"
  ) {
    invalid();
  }
  return value;
}

function status(value: unknown): ResumeStatus {
  if (value !== "draft" && value !== "active" && value !== "archived") {
    invalid();
  }
  return value;
}

function parseDesign(value: unknown): ResumeDesign {
  const item = record(value);
  const pageSize = item.pageSize;
  if (pageSize !== "A4" && pageSize !== "LETTER") invalid();
  return {
    templateId: text(item.templateId, 100, 1),
    colorPaletteId: text(item.colorPaletteId, 100, 1),
    pageSize,
    ...(item.fontFamily === undefined
      ? {}
      : { fontFamily: text(item.fontFamily, 100) }),
    showProfilePhoto: boolean(item.showProfilePhoto),
  };
}

type ContentParsePolicy = {
  requireIds: boolean;
  requiredMinimum: 0 | 1;
  validateEmail: boolean;
  validateUrls: boolean;
};

const canonicalContentPolicy: ContentParsePolicy = {
  requireIds: true,
  requiredMinimum: 1,
  validateEmail: true,
  validateUrls: true,
};

const recoveryContentPolicy: ContentParsePolicy = {
  requireIds: false,
  requiredMinimum: 0,
  validateEmail: false,
  validateUrls: false,
};

function entityIdentifier(
  item: Record<string, unknown>,
  policy: ContentParsePolicy,
): { id?: string } {
  if (policy.requireIds) return { id: uuid(item.id) };
  return item.id === undefined ? {} : { id: uuid(item.id) };
}

function contentUrl(
  value: unknown,
  policy: ContentParsePolicy,
): string {
  return policy.validateUrls
    ? url(value)
    : text(value, 2_000, policy.requiredMinimum);
}

function parseLink(value: unknown, policy: ContentParsePolicy) {
  const item = record(value);
  return {
    ...entityIdentifier(item, policy),
    label: text(item.label, 80, policy.requiredMinimum),
    url: contentUrl(item.url, policy),
  };
}

function parseBullet(value: unknown, policy: ContentParsePolicy) {
  const item = record(value);
  return {
    ...entityIdentifier(item, policy),
    text: text(item.text, 2_000, policy.requiredMinimum),
  };
}

function parseContent(
  value: unknown,
  policy: ContentParsePolicy,
): ResumeContentInput {
  const item = record(value);
  const basics = record(item.basics);
  const emailValue = optionalText(basics.email, 320);
  if (
    policy.validateEmail &&
    emailValue &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
  ) {
    invalid();
  }

  return {
    basics: {
      fullName: text(basics.fullName, 200),
      ...(emailValue === undefined ? {} : { email: emailValue }),
      ...(basics.phone === undefined
        ? {}
        : { phone: text(basics.phone, 80) }),
      ...(basics.location === undefined
        ? {}
        : { location: text(basics.location, 200) }),
      ...(basics.headline === undefined
        ? {}
        : { headline: text(basics.headline, 200) }),
      ...(basics.summary === undefined
        ? {}
        : { summary: text(basics.summary, 5_000) }),
      links: array(basics.links, 20, (entry) => parseLink(entry, policy)),
    },
    experience: array(item.experience, 50, (value) => {
      const entry = record(value);
      return {
        ...entityIdentifier(entry, policy),
        employer: text(entry.employer, 200, policy.requiredMinimum),
        jobTitle: text(entry.jobTitle, 200, policy.requiredMinimum),
        ...(entry.location === undefined
          ? {}
          : { location: text(entry.location, 200) }),
        ...(entry.startDate === undefined
          ? {}
          : { startDate: text(entry.startDate, 30) }),
        ...(entry.endDate === undefined
          ? {}
          : { endDate: text(entry.endDate, 30) }),
        isCurrent: boolean(entry.isCurrent),
        bullets: array(entry.bullets, 50, (bullet) =>
          parseBullet(bullet, policy),
        ),
      };
    }),
    education: array(item.education, 30, (value) => {
      const entry = record(value);
      return {
        ...entityIdentifier(entry, policy),
        institution: text(entry.institution, 200, policy.requiredMinimum),
        qualification: text(entry.qualification, 200, policy.requiredMinimum),
        ...(entry.fieldOfStudy === undefined
          ? {}
          : { fieldOfStudy: text(entry.fieldOfStudy, 200) }),
        ...(entry.location === undefined
          ? {}
          : { location: text(entry.location, 200) }),
        ...(entry.startDate === undefined
          ? {}
          : { startDate: text(entry.startDate, 30) }),
        ...(entry.endDate === undefined
          ? {}
          : { endDate: text(entry.endDate, 30) }),
        isCurrent: boolean(entry.isCurrent),
        details: array(entry.details, 30, (detail) =>
          parseBullet(detail, policy),
        ),
      };
    }),
    skills: array(item.skills, 30, (value) => {
      const entry = record(value);
      return {
        ...entityIdentifier(entry, policy),
        name: text(entry.name, 120, policy.requiredMinimum),
        keywords: array(entry.keywords, 100, (keyword) =>
          text(keyword, 120, policy.requiredMinimum),
        ),
      };
    }),
    projects: array(item.projects, 50, (value) => {
      const entry = record(value);
      return {
        ...entityIdentifier(entry, policy),
        name: text(entry.name, 200, policy.requiredMinimum),
        ...(entry.role === undefined ? {} : { role: text(entry.role, 160) }),
        ...(entry.description === undefined
          ? {}
          : { description: text(entry.description, 2_000) }),
        ...(entry.startDate === undefined
          ? {}
          : { startDate: text(entry.startDate, 30) }),
        ...(entry.endDate === undefined
          ? {}
          : { endDate: text(entry.endDate, 30) }),
        technologies: array(entry.technologies, 100, (technology) =>
          text(technology, 120, policy.requiredMinimum),
        ),
        links: array(entry.links, 20, (link) => parseLink(link, policy)),
        bullets: array(entry.bullets, 50, (bullet) =>
          parseBullet(bullet, policy),
        ),
      };
    }),
    certifications: array(item.certifications, 50, (value) => {
      const entry = record(value);
      return {
        ...entityIdentifier(entry, policy),
        name: text(entry.name, 200, policy.requiredMinimum),
        ...(entry.issuer === undefined
          ? {}
          : { issuer: text(entry.issuer, 200) }),
        ...(entry.issuedDate === undefined
          ? {}
          : { issuedDate: text(entry.issuedDate, 30) }),
        ...(entry.credentialUrl === undefined
          ? {}
          : { credentialUrl: contentUrl(entry.credentialUrl, policy) }),
      };
    }),
    languages: array(item.languages, 30, (value) => {
      const entry = record(value);
      return {
        ...entityIdentifier(entry, policy),
        name: text(entry.name, 120, policy.requiredMinimum),
        ...(entry.proficiency === undefined
          ? {}
          : { proficiency: text(entry.proficiency, 80) }),
      };
    }),
    interests: array(item.interests, 50, (interest) =>
      text(interest, 120, policy.requiredMinimum),
    ),
  };
}

function exactEntityKeys(
  value: unknown,
  required: readonly string[],
  optional: readonly string[],
  policy: ContentParsePolicy,
): Record<string, unknown> {
  return policy.requireIds
    ? exactKeys(value, ["id", ...required], optional)
    : exactKeys(value, required, ["id", ...optional]);
}

function assertExactContentKeys(
  value: unknown,
  policy: ContentParsePolicy,
): void {
  const item = exactKeys(value, [
    "basics",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
    "interests",
  ]);
  const basics = exactKeys(
    item.basics,
    ["fullName", "links"],
    ["email", "phone", "location", "headline", "summary"],
  );
  array(basics.links, 20, (link) =>
    exactEntityKeys(link, ["label", "url"], [], policy),
  );
  const bullet = (value: unknown) =>
    exactEntityKeys(value, ["text"], [], policy);
  array(item.experience, 50, (value) => {
    const entry = exactEntityKeys(
      value,
      ["employer", "jobTitle", "isCurrent", "bullets"],
      ["location", "startDate", "endDate"],
      policy,
    );
    array(entry.bullets, 50, bullet);
    return entry;
  });
  array(item.education, 30, (value) => {
    const entry = exactEntityKeys(
      value,
      ["institution", "qualification", "isCurrent", "details"],
      ["fieldOfStudy", "location", "startDate", "endDate"],
      policy,
    );
    array(entry.details, 30, bullet);
    return entry;
  });
  array(item.skills, 30, (value) =>
    exactEntityKeys(value, ["name", "keywords"], [], policy),
  );
  array(item.projects, 50, (value) => {
    const entry = exactEntityKeys(
      value,
      ["name", "technologies", "links", "bullets"],
      ["role", "description", "startDate", "endDate"],
      policy,
    );
    array(entry.links, 20, (link) =>
      exactEntityKeys(link, ["label", "url"], [], policy),
    );
    array(entry.bullets, 50, bullet);
    return entry;
  });
  array(item.certifications, 50, (value) =>
    exactEntityKeys(
      value,
      ["name"],
      ["issuer", "issuedDate", "credentialUrl"],
      policy,
    ),
  );
  array(item.languages, 30, (value) =>
    exactEntityKeys(value, ["name"], ["proficiency"], policy),
  );
}

export function parseResumeContent(value: unknown): ResumeContent {
  assertExactContentKeys(value, canonicalContentPolicy);
  return parseContent(value, canonicalContentPolicy) as ResumeContent;
}

export function parseResumeRecoveryContent(
  value: unknown,
): ResumeContentInput {
  assertExactContentKeys(value, recoveryContentPolicy);
  return parseContent(value, recoveryContentPolicy);
}

function parseResume(value: unknown): ResumeRecord {
  const item = record(value);
  return {
    id: id(item.id ?? item._id),
    title: text(item.title, 120, 1),
    status: status(item.status),
    ...(optionalId(item.currentVersionId) === undefined
      ? {}
      : { currentVersionId: optionalId(item.currentVersionId) }),
    latestVersionNumber: integer(item.latestVersionNumber, 0),
    design: parseDesign(item.design),
    createdAt: date(item.createdAt),
    updatedAt: date(item.updatedAt),
  };
}

export function parseResumeEnvelope(value: unknown): ResumeRecord {
  return parseResume(record(value).resume);
}

function parsePagination(value: unknown): Pagination {
  const item = record(value);
  const page = integer(item.page, 1);
  const limit = integer(item.limit, 1, 100);
  const total = integer(item.total, 0);
  const pages = integer(item.pages, 0);
  if (
    pages !== Math.ceil(total / limit) ||
    (pages > 0 && page > pages) ||
    (pages === 0 && page !== 1)
  ) {
    invalid();
  }
  return { page, limit, total, pages };
}

function parseVersionMetadata(value: unknown): ResumeVersionMetadata {
  const item = record(value);
  return {
    id: id(item.id ?? item._id),
    versionNumber: integer(item.versionNumber, 1),
    ...(optionalId(item.parentVersionId) === undefined
      ? {}
      : { parentVersionId: optionalId(item.parentVersionId) }),
    source: source(item.source),
    ...(item.changeSummary === undefined
      ? {}
      : { changeSummary: text(item.changeSummary, 500) }),
    createdAt: date(item.createdAt),
  };
}

function parseVersion(value: unknown): ResumeVersion {
  const item = record(value);
  return {
    ...parseVersionMetadata(item),
    resumeId: id(item.resumeId),
    content: parseContent(
      item.content,
      canonicalContentPolicy,
    ) as ResumeContent,
    updatedAt: date(item.updatedAt),
  };
}

export function parseResumeWorkspace(
  value: unknown,
): ResumeWorkspaceData {
  const item = record(value);
  const resume = parseResume(item.resume);
  const version = parseVersion(item.version);
  if (
    version.resumeId !== resume.id ||
    resume.currentVersionId !== version.id
  ) {
    invalid();
  }
  return { resume, version };
}

export function parseResumeList(value: unknown): ResumeListPageData {
  const item = record(value);
  return {
    resumes: array(item.resumes, 100, parseResume),
    pagination: parsePagination(item.pagination),
  };
}

export function parseVersionList(
  value: unknown,
): ResumeVersionPageData {
  const item = record(value);
  return {
    versions: array(item.versions, 100, parseVersionMetadata),
    pagination: parsePagination(item.pagination),
  };
}

export function parseVersionEnvelope(value: unknown): ResumeVersion {
  return parseVersion(record(value).version);
}

export function parseAcceptedJob(
  value: unknown,
  expectedType: ResumeJob["type"],
): Pick<ResumeJob, "id" | "type" | "status"> {
  const item = record(record(value).job);
  const type = item.type;
  if (type !== expectedType) invalid();
  const jobStatus = item.status;
  if (jobStatus !== "queued" && jobStatus !== "processing") invalid();
  return {
    id: id(item.id),
    type: expectedType,
    status: jobStatus,
  };
}

function parseImportPhotoCandidates(
  value: unknown,
): ResumeImportPhotoCandidate[] {
  const candidates = array(value, 3, (candidate) => {
    const item = exactKeys(candidate, ["assetId"]);
    return { assetId: id(item.assetId) };
  });
  const unique = new Set(candidates.map((candidate) => candidate.assetId));
  if (unique.size !== candidates.length) invalid();
  return candidates;
}

function parseCompletedResult(
  type: ResumeJob["type"],
  value: unknown,
): ResumeJob["result"] {
  const item = record(value);
  if (type === "resume.import-pdf") {
    if (item.kind === "import-review") {
      const review = exactKeys(
        item,
        ["kind", "content"],
        ["photoCandidates"],
      );
      const photoCandidates =
        review.photoCandidates === undefined
          ? undefined
          : parseImportPhotoCandidates(review.photoCandidates);
      return {
        kind: "import-review",
        content: parseResumeContent(review.content),
        ...(photoCandidates === undefined ? {} : { photoCandidates }),
      };
    }
    if (item.kind === "import-adopted") {
      const adopted = exactKeys(item, [
        "kind",
        "resumeId",
        "versionId",
        "versionNumber",
      ]);
      return {
        kind: "import-adopted",
        resumeId: id(adopted.resumeId),
        versionId: id(adopted.versionId),
        versionNumber: integer(adopted.versionNumber, 1),
      };
    }
    invalid();
  }
  return {
    kind: "analysis",
    analysisId: id(item.analysisId),
    resumeId: id(item.resumeId),
    resumeVersionId: id(item.resumeVersionId),
    totalScore: integer(item.totalScore, 0, 100),
  };
}

export function parseJob(value: unknown): ResumeJob {
  const item = record(record(value).job);
  const type = item.type;
  if (type !== "resume.import-pdf" && type !== "resume.analyze") invalid();
  const jobStatus = item.status;
  if (
    jobStatus !== "queued" &&
    jobStatus !== "processing" &&
    jobStatus !== "completed" &&
    jobStatus !== "failed" &&
    jobStatus !== "cancelled"
  ) {
    invalid();
  }
  const errorValue =
    item.error === undefined || item.error === null
      ? undefined
      : record(item.error);
  return {
    id: id(item.id),
    type,
    status: jobStatus,
    ...parseJobResilienceMetadata(item, jobStatus),
    progress: integer(item.progress, 0, 100),
    attempts: integer(item.attempts, 0, 10),
    maxAttempts: integer(item.maxAttempts, 1, 10),
    ...(jobStatus === "completed"
      ? { result: parseCompletedResult(type, item.result) }
      : {}),
    ...(errorValue === undefined
      ? {}
      : {
          error: {
            code: text(errorValue.code, 120, 1),
            message: text(errorValue.message, 2_000, 1),
          },
        }),
    createdAt: date(item.createdAt),
    updatedAt: date(item.updatedAt),
  };
}

export function parseAnalysis(value: unknown): ResumeAnalysis {
  const item = record(record(value).analysis);
  const target = record(item.target);
  const scores = record(item.scoreBreakdown);
  const scoreBreakdown = {
    keywordMatch: integer(scores.keywordMatch, 0, 25),
    clarity: integer(scores.clarity, 0, 25),
    evidence: integer(scores.evidence, 0, 25),
    formatting: integer(scores.formatting, 0, 25),
  };
  const totalScore = integer(item.totalScore, 0, 100);
  if (
    Object.values(scoreBreakdown).reduce((sum, score) => sum + score, 0) !==
    totalScore
  ) {
    invalid();
  }
  return {
    id: id(item.id ?? item._id),
    resumeId: id(item.resumeId),
    resumeVersionId: id(item.resumeVersionId),
    target: {
      role: text(target.role, 200, 1),
      ...(target.company === undefined
        ? {}
        : { company: text(target.company, 200) }),
    },
    scoreBreakdown,
    totalScore,
    issues: array(item.issues, 50, (value) => {
      const issue = record(value);
      const severity = issue.severity;
      if (
        severity !== "low" &&
        severity !== "medium" &&
        severity !== "high"
      ) {
        invalid();
      }
      return {
        code: text(issue.code, 120, 1),
        severity,
        message: text(issue.message, 1_000, 1),
      };
    }),
    strengths: array(item.strengths, 30, (value) => {
      const strength = record(value);
      return {
        title: text(strength.title, 200, 1),
        detail: text(strength.detail, 1_000, 1),
      };
    }),
    missingKeywords: array(item.missingKeywords, 100, (keyword) =>
      text(keyword, 120, 1),
    ),
    suggestions: array(item.suggestions, 100, (value) => {
      const suggestion = record(value);
      return {
        id: uuid(suggestion.id),
        bulletId: uuid(suggestion.bulletId),
        originalText: text(suggestion.originalText, 2_000, 1),
        rewrittenText: text(suggestion.rewrittenText, 2_000, 1),
        rationale: text(suggestion.rationale, 1_000, 1),
        verificationRequired: boolean(suggestion.verificationRequired),
      };
    }),
    createdAt: date(item.createdAt),
    updatedAt: date(item.updatedAt),
  };
}

export function parseApplyResult(value: unknown): {
  resume: ResumeRecord;
  version: ResumeVersion;
  appliedCount: number;
} {
  const item = record(value);
  const resume = parseResume(item.resume);
  const version = parseVersion(item.version);
  const appliedCount = integer(item.appliedCount, 1, 100);
  if (
    version.resumeId !== resume.id ||
    resume.currentVersionId !== version.id
  ) {
    invalid();
  }
  return { resume, version, appliedCount };
}
