import type {
  ClientEntity,
  ResumeContent,
  ResumeContentInput,
  ResumeDraft,
} from "./types";

let clientKeyCounter = 0;

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

export function draftToInput(
  draft: ResumeDraft,
): ResumeContentInput {
  const { email, ...basics } = draft.basics;
  return {
    basics: {
      ...basics,
      ...(email?.trim() ? { email } : {}),
      links: draft.basics.links.map(persisted),
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
      links: entry.links.map(persisted),
      bullets: entry.bullets.map(persisted),
    })),
    certifications: draft.certifications.map((entry) => {
      const persistedEntry = persisted(entry);
      if (persistedEntry.credentialUrl?.trim()) return persistedEntry;
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

export function validateResumeDraft(draft: ResumeDraft): string[] {
  const errors: string[] = [];
  const required = (
    value: string,
    message: string,
  ) => {
    if (!value.trim()) errors.push(message);
  };

  if (
    draft.basics.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.basics.email)
  ) {
    errors.push("Email needs a valid address.");
  }
  draft.basics.links.forEach((link, index) => {
    required(link.label, `Link ${index + 1} needs a label.`);
    required(link.url, `Link ${index + 1} needs a URL.`);
    if (link.url && !URL.canParse(link.url.trim())) {
      errors.push(`Link ${index + 1} needs a valid URL.`);
    }
  });
  draft.experience.forEach((entry, index) => {
    required(
      entry.employer,
      `Experience ${index + 1} needs an employer.`,
    );
    required(
      entry.jobTitle,
      `Experience ${index + 1} needs a job title.`,
    );
    entry.bullets.forEach((bullet, bulletIndex) =>
      required(
        bullet.text,
        `Experience ${index + 1}, bullet ${bulletIndex + 1} cannot be empty.`,
      ),
    );
  });
  draft.education.forEach((entry, index) => {
    required(
      entry.institution,
      `Education ${index + 1} needs an institution.`,
    );
    required(
      entry.qualification,
      `Education ${index + 1} needs a qualification.`,
    );
    entry.details.forEach((detail, detailIndex) =>
      required(
        detail.text,
        `Education ${index + 1}, detail ${detailIndex + 1} cannot be empty.`,
      ),
    );
  });
  draft.skills.forEach((entry, index) =>
    required(entry.name, `Skill group ${index + 1} needs a name.`),
  );
  draft.projects.forEach((entry, index) => {
    required(entry.name, `Project ${index + 1} needs a name.`);
    entry.links.forEach((link, linkIndex) => {
      required(
        link.label,
        `Project ${index + 1}, link ${linkIndex + 1} needs a label.`,
      );
      required(
        link.url,
        `Project ${index + 1}, link ${linkIndex + 1} needs a URL.`,
      );
      if (link.url && !URL.canParse(link.url.trim())) {
        errors.push(
          `Project ${index + 1}, link ${linkIndex + 1} needs a valid URL.`,
        );
      }
    });
    entry.bullets.forEach((bullet, bulletIndex) =>
      required(
        bullet.text,
        `Project ${index + 1}, bullet ${bulletIndex + 1} cannot be empty.`,
      ),
    );
  });
  draft.certifications.forEach((entry, index) => {
    required(
      entry.name,
      `Certification ${index + 1} needs a name.`,
    );
    if (
      entry.credentialUrl &&
      !URL.canParse(entry.credentialUrl.trim())
    ) {
      errors.push(
        `Certification ${index + 1} needs a valid credential URL.`,
      );
    }
  });
  draft.languages.forEach((entry, index) =>
    required(entry.name, `Language ${index + 1} needs a name.`),
  );
  draft.interests.forEach((entry, index) =>
    required(entry.value, `Interest ${index + 1} cannot be empty.`),
  );
  return errors;
}
