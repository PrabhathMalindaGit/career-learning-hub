import type {
  ResumeContent,
  ResumeDesign,
  ResumeSource,
} from "../modules/resumes/resume.types.js";
import type { SourceProject } from "./migrationMap.model.js";
import {
  asBoolean,
  asString,
  asStringArray,
  firstDefined,
  legacyIdOf,
  optionalString,
  stableUuid,
  type UnknownRecord,
} from "./migration.utils.js";

function objectArray(value: unknown): UnknownRecord[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is UnknownRecord =>
          Boolean(entry) &&
          typeof entry === "object" &&
          !Array.isArray(entry),
      )
    : [];
}

function textBullets(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry && typeof entry === "object") {
          return asString(
            firstDefined(entry as UnknownRecord, [
              "text",
              "description",
              "content",
              "bullet",
            ]),
          );
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|•|\u2022/)
      .map((entry) => entry.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
}

function makeLinks(
  project: SourceProject,
  resumeId: string,
  scope: string,
  value: unknown,
) {
  return objectArray(value)
    .map((entry, index) => {
      const url = asString(
        firstDefined(entry, ["url", "href", "link"]),
      );
      if (!url) return undefined;

      return {
        id: stableUuid(
          project,
          "resume",
          resumeId,
          scope,
          legacyIdOf(entry, String(index)),
        ),
        label:
          asString(
            firstDefined(entry, [
              "label",
              "name",
              "network",
              "type",
            ]),
          ) || "Link",
        url,
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        id: string;
        label: string;
        url: string;
      } => Boolean(entry),
    );
}

function contentRoot(record: UnknownRecord): UnknownRecord {
  const root = firstDefined(record, [
    "content",
    "parsedData",
    "resumeData",
    "data",
  ]);

  return root && typeof root === "object" && !Array.isArray(root)
    ? (root as UnknownRecord)
    : record;
}

export function normalizeResumeContent(input: {
  project: SourceProject;
  legacyResumeId: string;
  record: UnknownRecord;
}): ResumeContent {
  const root = contentRoot(input.record);
  const basicsRoot =
    firstDefined(root, [
      "basics",
      "personalInfo",
      "personalDetails",
      "profile",
      "contact",
    ]) ?? root;
  const basics =
    basicsRoot &&
    typeof basicsRoot === "object" &&
    !Array.isArray(basicsRoot)
      ? (basicsRoot as UnknownRecord)
      : root;

  const experience = objectArray(
    firstDefined(root, [
      "experience",
      "workExperience",
      "employment",
      "experiences",
    ]),
  ).map((entry, index) => {
    const entryId = legacyIdOf(entry, String(index));
    const bulletSource = firstDefined(entry, [
      "bullets",
      "achievements",
      "responsibilities",
      "highlights",
      "description",
    ]);

    return {
      id: stableUuid(
        input.project,
        "resume",
        input.legacyResumeId,
        "experience",
        entryId,
      ),
      employer:
        asString(
          firstDefined(entry, [
            "employer",
            "company",
            "companyName",
            "organization",
          ]),
        ) || "Unknown employer",
      jobTitle:
        asString(
          firstDefined(entry, [
            "jobTitle",
            "title",
            "position",
            "role",
          ]),
        ) || "Role",
      location: optionalString(
        firstDefined(entry, ["location", "city"]),
      ),
      startDate: optionalString(
        firstDefined(entry, [
          "startDate",
          "from",
          "start",
          "dateFrom",
        ]),
      ),
      endDate: optionalString(
        firstDefined(entry, [
          "endDate",
          "to",
          "end",
          "dateTo",
        ]),
      ),
      isCurrent: asBoolean(
        firstDefined(entry, [
          "isCurrent",
          "current",
          "present",
        ]),
      ),
      bullets: textBullets(bulletSource).map((text, bulletIndex) => ({
        id: stableUuid(
          input.project,
          "resume",
          input.legacyResumeId,
          "experience",
          entryId,
          "bullet",
          String(bulletIndex),
        ),
        text,
      })),
    };
  });

  const education = objectArray(
    firstDefined(root, [
      "education",
      "educations",
      "academicBackground",
    ]),
  ).map((entry, index) => {
    const entryId = legacyIdOf(entry, String(index));

    return {
      id: stableUuid(
        input.project,
        "resume",
        input.legacyResumeId,
        "education",
        entryId,
      ),
      institution:
        asString(
          firstDefined(entry, [
            "institution",
            "school",
            "university",
            "college",
          ]),
        ) || "Institution",
      qualification:
        asString(
          firstDefined(entry, [
            "qualification",
            "degree",
            "certificate",
          ]),
        ) || "Qualification",
      fieldOfStudy: optionalString(
        firstDefined(entry, [
          "fieldOfStudy",
          "field",
          "major",
          "specialization",
        ]),
      ),
      location: optionalString(entry.location),
      startDate: optionalString(
        firstDefined(entry, ["startDate", "from", "start"]),
      ),
      endDate: optionalString(
        firstDefined(entry, ["endDate", "to", "end"]),
      ),
      isCurrent: asBoolean(
        firstDefined(entry, ["isCurrent", "current"]),
      ),
      details: textBullets(
        firstDefined(entry, [
          "details",
          "highlights",
          "description",
          "achievements",
        ]),
      ).map((text, detailIndex) => ({
        id: stableUuid(
          input.project,
          "resume",
          input.legacyResumeId,
          "education",
          entryId,
          "detail",
          String(detailIndex),
        ),
        text,
      })),
    };
  });

  const rawSkills = firstDefined(root, [
    "skills",
    "skillGroups",
    "technicalSkills",
  ]);
  const skills =
    Array.isArray(rawSkills) &&
    rawSkills.every((entry) => typeof entry === "string")
      ? [
          {
            id: stableUuid(
              input.project,
              "resume",
              input.legacyResumeId,
              "skills",
              "general",
            ),
            name: "Skills",
            keywords: asStringArray(rawSkills),
          },
        ]
      : objectArray(rawSkills).map((entry, index) => ({
          id: stableUuid(
            input.project,
            "resume",
            input.legacyResumeId,
            "skills",
            legacyIdOf(entry, String(index)),
          ),
          name:
            asString(
              firstDefined(entry, [
                "name",
                "category",
                "group",
                "title",
              ]),
            ) || "Skills",
          keywords: asStringArray(
            firstDefined(entry, [
              "keywords",
              "skills",
              "items",
              "values",
            ]),
          ),
        }));

  const projects = objectArray(
    firstDefined(root, [
      "projects",
      "personalProjects",
      "portfolio",
    ]),
  ).map((entry, index) => {
    const entryId = legacyIdOf(entry, String(index));

    return {
      id: stableUuid(
        input.project,
        "resume",
        input.legacyResumeId,
        "project",
        entryId,
      ),
      name:
        asString(
          firstDefined(entry, ["name", "title", "projectName"]),
        ) || "Project",
      role: optionalString(entry.role),
      description: optionalString(entry.description),
      startDate: optionalString(
        firstDefined(entry, ["startDate", "start", "from"]),
      ),
      endDate: optionalString(
        firstDefined(entry, ["endDate", "end", "to"]),
      ),
      technologies: asStringArray(
        firstDefined(entry, [
          "technologies",
          "techStack",
          "skills",
          "tools",
        ]),
      ),
      links: makeLinks(
        input.project,
        input.legacyResumeId,
        `project-${entryId}-link`,
        firstDefined(entry, ["links", "urls"]),
      ),
      bullets: textBullets(
        firstDefined(entry, [
          "bullets",
          "highlights",
          "achievements",
        ]),
      ).map((text, bulletIndex) => ({
        id: stableUuid(
          input.project,
          "resume",
          input.legacyResumeId,
          "project",
          entryId,
          "bullet",
          String(bulletIndex),
        ),
        text,
      })),
    };
  });

  const certifications = objectArray(
    firstDefined(root, [
      "certifications",
      "certificates",
      "courses",
    ]),
  ).map((entry, index) => ({
    id: stableUuid(
      input.project,
      "resume",
      input.legacyResumeId,
      "certification",
      legacyIdOf(entry, String(index)),
    ),
    name:
      asString(
        firstDefined(entry, ["name", "title", "certificate"]),
      ) || "Certification",
    issuer: optionalString(
      firstDefined(entry, ["issuer", "organization"]),
    ),
    issuedDate: optionalString(
      firstDefined(entry, ["issuedDate", "date"]),
    ),
    credentialUrl: optionalString(
      firstDefined(entry, ["credentialUrl", "url"]),
    ),
  }));

  const languages = objectArray(
    firstDefined(root, ["languages", "languageSkills"]),
  ).map((entry, index) => ({
    id: stableUuid(
      input.project,
      "resume",
      input.legacyResumeId,
      "language",
      legacyIdOf(entry, String(index)),
    ),
    name:
      asString(firstDefined(entry, ["name", "language"])) ||
      "Language",
    proficiency: optionalString(
      firstDefined(entry, ["proficiency", "level"]),
    ),
  }));

  return {
    basics: {
      fullName:
        asString(
          firstDefined(basics, [
            "fullName",
            "name",
            "displayName",
          ]),
        ) || "",
      email: optionalString(basics.email),
      phone: optionalString(
        firstDefined(basics, ["phone", "phoneNumber", "mobile"]),
      ),
      location: optionalString(
        firstDefined(basics, ["location", "address", "city"]),
      ),
      headline: optionalString(
        firstDefined(basics, [
          "headline",
          "professionalTitle",
          "jobTitle",
        ]),
      ),
      summary: optionalString(
        firstDefined(root, [
          "basics.summary",
          "summary",
          "professionalSummary",
          "objective",
          "profileSummary",
        ]),
      ),
      links: makeLinks(
        input.project,
        input.legacyResumeId,
        "basic-link",
        firstDefined(basics, [
          "links",
          "profiles",
          "socialLinks",
        ]),
      ),
    },
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
    interests: asStringArray(
      firstDefined(root, ["interests", "hobbies"]),
    ),
  };
}

export function normalizeResumeDesign(
  record: UnknownRecord,
): ResumeDesign {
  const designValue =
    firstDefined(record, ["design", "template", "settings"]) ?? {};
  const design =
    designValue &&
    typeof designValue === "object" &&
    !Array.isArray(designValue)
      ? (designValue as UnknownRecord)
      : {};

  const rawPageSize = asString(
    firstDefined(design, ["pageSize", "paperSize"]),
  ).toUpperCase();

  return {
    templateId:
      asString(
        firstDefined(design, [
          "templateId",
          "template",
          "name",
        ]),
      ) || "ats-classic",
    colorPaletteId:
      asString(
        firstDefined(design, [
          "colorPaletteId",
          "palette",
          "color",
        ]),
      ) || "slate",
    pageSize: rawPageSize === "LETTER" ? "LETTER" : "A4",
    fontFamily:
      asString(
        firstDefined(design, ["fontFamily", "font"]),
      ) || "Inter",
    showProfilePhoto: asBoolean(
      firstDefined(design, [
        "showProfilePhoto",
        "includePhoto",
      ]),
    ),
  };
}

export function sourceForProject(
  project: SourceProject,
  record: UnknownRecord,
): ResumeSource {
  const raw = asString(record.source);
  if (
    raw === "manual" ||
    raw === "pdf-import" ||
    raw === "ai-rewrite" ||
    raw === "duplicate"
  ) {
    return raw;
  }

  return project === "ai-resume-analyser"
    ? "pdf-import"
    : "manual";
}
