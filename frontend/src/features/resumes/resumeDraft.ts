import type {
  ClientEntity,
  ResumeContent,
  ResumeContentInput,
  ResumeDraft,
} from "./types";

let clientKeyCounter = 0;

const DOMAIN_STYLE_URL =
  /^(?=.{1,253}(?:[/:?#]|$))(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#][^\s]*)?$/i;

export type ResumeDraftValidationError = {
  path: string;
  message: string;
};

const RESUME_EDITOR_FIELD_PATHS = [
  /^basics\.email$/,
  /^links\.\d+\.(?:label|url)$/,
  /^experience\.\d+\.(?:employer|jobTitle|location|startDate|endDate)$/,
  /^experience\.\d+\.bullets\.\d+\.text$/,
  /^education\.\d+\.(?:institution|qualification|fieldOfStudy|location|startDate|endDate)$/,
  /^education\.\d+\.details\.\d+\.text$/,
  /^skills\.\d+\.name$/,
  /^projects\.\d+\.(?:name|role|startDate|endDate)$/,
  /^projects\.\d+\.links\.\d+\.(?:label|url)$/,
  /^projects\.\d+\.bullets\.\d+\.text$/,
  /^certifications\.\d+\.(?:name|issuer|issuedDate|credentialUrl)$/,
  /^languages\.\d+\.name$/,
  /^interests\.\d+\.value$/,
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function resumeEditorPath(path: string): string | undefined {
  if (path.length === 0 || path.length > 256) return undefined;
  let mapped = path.startsWith("body.") ? path.slice(5) : path;
  mapped = mapped.startsWith("content.") ? mapped.slice(8) : mapped;
  if (mapped.startsWith("basics.links.")) {
    mapped = mapped.slice(7);
  }
  if (/^interests\.\d+$/.test(mapped)) {
    mapped = `${mapped}.value`;
  }
  return RESUME_EDITOR_FIELD_PATHS.some((pattern) => pattern.test(mapped))
    ? mapped
    : undefined;
}

export function parseResumeValidationDetails(
  details: unknown,
): ResumeDraftValidationError[] {
  if (!isRecord(details)) return [];
  const body = isRecord(details.body) ? details.body : undefined;
  const issues = Array.isArray(body?.issues)
    ? body.issues
    : Array.isArray(details.issues)
      ? details.issues
      : [];
  const errors: ResumeDraftValidationError[] = [];
  const seenPaths = new Set<string>();

  for (const issue of issues) {
    if (!isRecord(issue)) continue;
    if (
      typeof issue.path !== "string" ||
      typeof issue.message !== "string"
    ) {
      continue;
    }
    const path = resumeEditorPath(issue.path);
    const message = issue.message.trim();
    if (!path || !message || message.length > 500 || seenPaths.has(path)) {
      continue;
    }
    seenPaths.add(path);
    errors.push({ path, message });
  }

  return errors;
}

export function resumeFieldId(path: string): string {
  return `resume-field-${path.replaceAll(".", "-")}`;
}

export function normalizeResumeUrlInput(
  value: string,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  const hasSupportedScheme = /^https?:\/\//i.test(trimmed);
  if (
    (hasScheme && !hasSupportedScheme) ||
    (!hasScheme && !DOMAIN_STYLE_URL.test(trimmed))
  ) {
    return undefined;
  }

  const candidate = hasSupportedScheme ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password ||
      !parsed.hostname
    ) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return candidate;
}

function clientKey(): string {
  clientKeyCounter += 1;
  return `resume-draft-${Date.now()}-${clientKeyCounter}`;
}

export function createDraftEntity<T extends object>(
  value: T,
): T & ClientEntity {
  return { ...value, clientKey: clientKey() };
}

function loaded<T extends { id: string }>(
  value: T,
): Omit<T, "id"> & ClientEntity {
  const { id, ...rest } = value;
  return { ...rest, id, clientKey: id };
}

export function resumeContentToDraft(
  content: ResumeContent,
): ResumeDraft {
  return {
    basics: {
      ...content.basics,
      links: content.basics.links.map(loaded),
    },
    experience: content.experience.map((entry) => ({
      ...loaded(entry),
      bullets: entry.bullets.map(loaded),
    })),
    education: content.education.map((entry) => ({
      ...loaded(entry),
      details: entry.details.map(loaded),
    })),
    skills: content.skills.map(loaded),
    projects: content.projects.map((entry) => ({
      ...loaded(entry),
      links: entry.links.map(loaded),
      bullets: entry.bullets.map(loaded),
    })),
    certifications: content.certifications.map(loaded),
    languages: content.languages.map(loaded),
    interests: content.interests.map((value) =>
      createDraftEntity({ value }),
    ),
  };
}

function persisted<T extends ClientEntity>(
  value: T,
): Omit<T, "clientKey"> {
  const { clientKey: _clientKey, ...rest } = value;
  return rest;
}

function persistedLink<T extends ClientEntity & { url: string }>(
  value: T,
): Omit<T, "clientKey"> {
  return {
    ...persisted(value),
    url: normalizeResumeUrlInput(value.url) ?? value.url.trim(),
  };
}

export function draftToInput(
  draft: ResumeDraft,
): ResumeContentInput {
  const { email, ...basics } = draft.basics;
  return {
    basics: {
      ...basics,
      ...(email?.trim() ? { email } : {}),
      links: draft.basics.links.map(persistedLink),
    },
    experience: draft.experience.map((entry) => ({
      ...persisted(entry),
      bullets: entry.bullets.map(persisted),
    })),
    education: draft.education.map((entry) => ({
      ...persisted(entry),
      details: entry.details.map(persisted),
    })),
    skills: draft.skills.map(persisted),
    projects: draft.projects.map((entry) => ({
      ...persisted(entry),
      links: entry.links.map(persistedLink),
      bullets: entry.bullets.map(persisted),
    })),
    certifications: draft.certifications.map((entry) => {
      const persistedEntry = persisted(entry);
      if (persistedEntry.credentialUrl?.trim()) {
        return {
          ...persistedEntry,
          credentialUrl:
            normalizeResumeUrlInput(persistedEntry.credentialUrl) ??
            persistedEntry.credentialUrl.trim(),
        };
      }
      const {
        credentialUrl: _credentialUrl,
        ...withoutCredentialUrl
      } = persistedEntry;
      return withoutCredentialUrl;
    }),
    languages: draft.languages.map(persisted),
    interests: draft.interests.map((interest) => interest.value),
  };
}

export function draftFingerprint(draft: ResumeDraft): string {
  return JSON.stringify(draftToInput(draft));
}

export function validateResumeDraft(
  draft: ResumeDraft,
): ResumeDraftValidationError[] {
  const errors: ResumeDraftValidationError[] = [];
  const add = (path: string, message: string) => {
    errors.push({ path, message });
  };
  const required = (
    value: string,
    path: string,
    message: string,
  ) => {
    if (!value.trim()) add(path, message);
  };

  if (
    draft.basics.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.basics.email)
  ) {
    add("basics.email", "Email needs a valid address.");
  }
  draft.basics.links.forEach((link, index) => {
    required(
      link.label,
      `links.${index}.label`,
      `Link ${index + 1} needs a label.`,
    );
    required(
      link.url,
      `links.${index}.url`,
      `Link ${index + 1} needs a URL.`,
    );
    if (link.url && !normalizeResumeUrlInput(link.url)) {
      add(
        `links.${index}.url`,
        `Link ${index + 1} needs a valid URL.`,
      );
    }
  });
  draft.experience.forEach((entry, index) => {
    required(
      entry.employer,
      `experience.${index}.employer`,
      `Experience ${index + 1} needs an employer.`,
    );
    required(
      entry.jobTitle,
      `experience.${index}.jobTitle`,
      `Experience ${index + 1} needs a job title.`,
    );
    entry.bullets.forEach((bullet, bulletIndex) =>
      required(
        bullet.text,
        `experience.${index}.bullets.${bulletIndex}.text`,
        `Experience ${index + 1}, bullet ${bulletIndex + 1} cannot be empty.`,
      ),
    );
  });
  draft.education.forEach((entry, index) => {
    required(
      entry.institution,
      `education.${index}.institution`,
      `Education ${index + 1} needs an institution.`,
    );
    required(
      entry.qualification,
      `education.${index}.qualification`,
      `Education ${index + 1} needs a qualification.`,
    );
    entry.details.forEach((detail, detailIndex) =>
      required(
        detail.text,
        `education.${index}.details.${detailIndex}.text`,
        `Education ${index + 1}, detail ${detailIndex + 1} cannot be empty.`,
      ),
    );
  });
  draft.skills.forEach((entry, index) =>
    required(
      entry.name,
      `skills.${index}.name`,
      `Skill group ${index + 1} needs a name.`,
    ),
  );
  draft.projects.forEach((entry, index) => {
    required(
      entry.name,
      `projects.${index}.name`,
      `Project ${index + 1} needs a name.`,
    );
    entry.links.forEach((link, linkIndex) => {
      required(
        link.label,
        `projects.${index}.links.${linkIndex}.label`,
        `Project ${index + 1}, link ${linkIndex + 1} needs a label.`,
      );
      required(
        link.url,
        `projects.${index}.links.${linkIndex}.url`,
        `Project ${index + 1}, link ${linkIndex + 1} needs a URL.`,
      );
      if (link.url && !normalizeResumeUrlInput(link.url)) {
        add(
          `projects.${index}.links.${linkIndex}.url`,
          `Project ${index + 1}, link ${linkIndex + 1} needs a valid URL.`,
        );
      }
    });
    entry.bullets.forEach((bullet, bulletIndex) =>
      required(
        bullet.text,
        `projects.${index}.bullets.${bulletIndex}.text`,
        `Project ${index + 1}, bullet ${bulletIndex + 1} cannot be empty.`,
      ),
    );
  });
  draft.certifications.forEach((entry, index) => {
    required(
      entry.name,
      `certifications.${index}.name`,
      `Certification ${index + 1} needs a name.`,
    );
    if (
      entry.credentialUrl &&
      !normalizeResumeUrlInput(entry.credentialUrl)
    ) {
      add(
        `certifications.${index}.credentialUrl`,
        `Certification ${index + 1} needs a valid credential URL.`,
      );
    }
  });
  draft.languages.forEach((entry, index) =>
    required(
      entry.name,
      `languages.${index}.name`,
      `Language ${index + 1} needs a name.`,
    ),
  );
  draft.interests.forEach((entry, index) =>
    required(
      entry.value,
      `interests.${index}.value`,
      `Interest ${index + 1} cannot be empty.`,
    ),
  );
  return errors;
}
