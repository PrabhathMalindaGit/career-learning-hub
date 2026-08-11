import { describe, expect, it } from "vitest";
import {
  createDraftEntity,
  draftFingerprint,
  draftToInput,
  normalizeResumeUrlInput,
  parseResumeValidationDetails,
  resumeContentInputToDraft,
  resumeContentToDraft,
  validateResumeDraft,
} from "./resumeDraft";
import type { ResumeContent, ResumeContentInput } from "./types";

const linkId = "123e4567-e89b-42d3-a456-426614174000";
const experienceId = "123e4567-e89b-42d3-a456-426614174001";
const bulletId = "123e4567-e89b-42d3-a456-426614174002";

function content(): ResumeContent {
  return {
    basics: {
      fullName: "Synthetic Candidate",
      links: [
        {
          id: linkId,
          label: "Portfolio",
          url: "https://example.test",
        },
      ],
    },
    experience: [
      {
        id: experienceId,
        employer: "Example",
        jobTitle: "Engineer",
        isCurrent: true,
        bullets: [{ id: bulletId, text: "Built a private test system." }],
      },
    ],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

describe("resume draft identity", () => {
  it("preserves every loaded persisted ID through draft serialization", () => {
    const draft = resumeContentToDraft(content());
    const input = draftToInput(draft);

    expect(draft.basics.links[0]?.clientKey).toBe(linkId);
    expect(draft.experience[0]?.clientKey).toBe(experienceId);
    expect(draft.experience[0]?.bullets[0]?.clientKey).toBe(bulletId);
    expect(input.basics.links[0]?.id).toBe(linkId);
    expect(input.experience[0]?.id).toBe(experienceId);
    expect(input.experience[0]?.bullets[0]?.id).toBe(bulletId);
  });

  it("uses a separate client key and omits persisted ID for new content", () => {
    const first = createDraftEntity({ text: "New bullet" });
    const second = createDraftEntity({ text: "New bullet" });
    const draft = resumeContentToDraft(content());
    draft.experience[0]?.bullets.push(first);

    const input = draftToInput(draft);

    expect(first.clientKey).not.toBe(second.clientKey);
    expect(first).not.toHaveProperty("id");
    expect(input.experience[0]?.bullets[1]).toEqual({
      text: "New bullet",
    });
    expect(JSON.stringify(input)).not.toContain("clientKey");
  });

  it("reconstructs incomplete recoverable input without persisting client keys", () => {
    const recoverable: ResumeContentInput = {
      basics: { fullName: "", links: [] },
      experience: [
        {
          employer: "Example",
          jobTitle: "",
          isCurrent: false,
          bullets: [{ text: "Mid-edit bullet" }],
        },
      ],
      education: [
        {
          id: experienceId,
          institution: "",
          qualification: "BSc",
          isCurrent: true,
          details: [],
        },
      ],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
      interests: [""],
    };

    const draft = resumeContentInputToDraft(recoverable);
    const roundTrip = draftToInput(draft);

    expect(draft.experience[0]?.clientKey).toMatch(/^resume-draft-/);
    expect(draft.experience[0]?.bullets[0]?.clientKey).toMatch(
      /^resume-draft-/,
    );
    expect(draft.education[0]?.clientKey).toBe(experienceId);
    expect(roundTrip).toEqual(recoverable);
    expect(JSON.stringify(roundTrip)).not.toContain("clientKey");
  });

  it("uses the existing normalized draft comparison for recoverable input", () => {
    const recoverable: ResumeContentInput = {
      ...content(),
      basics: {
        ...content().basics,
        links: [
          {
            id: linkId,
            label: "Portfolio",
            url: " example.test ",
          },
        ],
      },
    };

    expect(
      draftFingerprint(resumeContentInputToDraft(recoverable)),
    ).toBe(
      draftFingerprint(
        resumeContentInputToDraft({
          ...recoverable,
          basics: {
            ...recoverable.basics,
            links: [
              {
                id: linkId,
                label: "Portfolio",
                url: "https://example.test",
              },
            ],
          },
        }),
      ),
    );
  });

  it("omits cleared optional email and credential URLs from save input", () => {
    const draft = resumeContentToDraft(content());
    draft.basics.email = "";
    draft.certifications.push(
      createDraftEntity({
        name: "Synthetic Credential",
        credentialUrl: "",
      }),
    );

    const input = draftToInput(draft);

    expect(input.basics).not.toHaveProperty("email");
    expect(input.certifications[0]).not.toHaveProperty("credentialUrl");
  });

  it("validates exact required fields and collection content before save", () => {
    const draft = resumeContentToDraft(content());
    draft.experience.push(
      createDraftEntity({
        employer: "",
        jobTitle: "",
        isCurrent: false,
        bullets: [],
      }),
    );

    expect(validateResumeDraft(draft)).toEqual(
      expect.arrayContaining([
        {
          path: "experience.1.employer",
          message: "Experience 2 needs an employer.",
        },
        {
          path: "experience.1.jobTitle",
          message: "Experience 2 needs a job title.",
        },
      ]),
    );
  });

  it("rejects an invalid optional email before save", () => {
    const draft = resumeContentToDraft(content());
    draft.basics.email = "invalid-email";

    expect(validateResumeDraft(draft)).toContainEqual({
      path: "basics.email",
      message: "Email needs a valid address.",
    });
  });

  it("rejects invalid project and credential URLs before save", () => {
    const draft = resumeContentToDraft(content());
    draft.projects.push(
      createDraftEntity({
        name: "Synthetic Project",
        technologies: [],
        links: [
          createDraftEntity({
            label: "Project",
            url: "not-a-url",
          }),
        ],
        bullets: [],
      }),
    );
    draft.certifications.push(
      createDraftEntity({
        name: "Synthetic Credential",
        credentialUrl: "not-a-url",
      }),
    );

    expect(validateResumeDraft(draft)).toEqual(
      expect.arrayContaining([
        {
          path: "projects.0.links.0.url",
          message: "Project 1, link 1 needs a valid URL.",
        },
        {
          path: "certifications.0.credentialUrl",
          message: "Certification 1 needs a valid credential URL.",
        },
      ]),
    );
  });

  it.each([
    ["https://github.com/example", "https://github.com/example"],
    ["http://example.test/profile", "http://example.test/profile"],
    [" github.com/example ", "https://github.com/example"],
  ])("normalizes a safe public URL %s", (value, expected) => {
    expect(normalizeResumeUrlInput(value)).toBe(expected);
  });

  it.each([
    "not a url",
    "localhost/profile",
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "ftp://example.test/profile",
    "http:example.test/profile",
    "//example.test/profile",
  ])("rejects an ambiguous or unsupported URL %s", (value) => {
    expect(normalizeResumeUrlInput(value)).toBeUndefined();
  });

  it("normalizes every safe Resume URL before save", () => {
    const draft = resumeContentToDraft(content());
    draft.basics.links[0]!.url = " github.com/example ";
    draft.projects.push(
      createDraftEntity({
        name: "Synthetic Project",
        technologies: [],
        links: [
          createDraftEntity({
            label: "Project",
            url: "example.test/project",
          }),
        ],
        bullets: [],
      }),
    );
    draft.certifications.push(
      createDraftEntity({
        name: "Synthetic Credential",
        credentialUrl: " credentials.example.test/verified ",
      }),
    );

    const input = draftToInput(draft);

    expect(input.basics.links[0]!.url).toBe("https://github.com/example");
    expect(input.projects[0]!.links[0]!.url).toBe(
      "https://example.test/project",
    );
    expect(input.certifications[0]!.credentialUrl).toBe(
      "https://credentials.example.test/verified",
    );
  });

  it("maps safe server issue paths to existing Resume editor fields", () => {
    expect(
      parseResumeValidationDetails({
        body: {
          formErrors: [],
          fieldErrors: {
            content: ["Basic link failed.", "Project link failed."],
          },
          issues: [
            {
              path: "content.basics.links.0.url",
              message: "Basic link failed.",
            },
            {
              path: "content.projects.0.links.0.url",
              message: "Project link failed.",
            },
            {
              path: "content.interests.1",
              message: "Interest failed.",
            },
          ],
        },
      }),
    ).toEqual([
      { path: "links.0.url", message: "Basic link failed." },
      {
        path: "projects.0.links.0.url",
        message: "Project link failed.",
      },
      { path: "interests.1.value", message: "Interest failed." },
    ]);
  });

  it("accepts root-level 422 issues and rejects malformed or unusable details", () => {
    expect(
      parseResumeValidationDetails({
        issues: [
          {
            path: "basics.email",
            message: "Email is unavailable.",
          },
          {
            path: "content.basics.links.2.label",
            message: "Link label is unavailable.",
          },
          {
            path: "content.unknown.0.value",
            message: "Unknown field.",
          },
          { path: ["content", "basics", "email"], message: "Wrong path type." },
          { path: "content.basics.email", message: 42 },
          null,
        ],
      }),
    ).toEqual([
      { path: "basics.email", message: "Email is unavailable." },
      {
        path: "links.2.label",
        message: "Link label is unavailable.",
      },
    ]);
    expect(parseResumeValidationDetails(undefined)).toEqual([]);
    expect(parseResumeValidationDetails({ body: { issues: "invalid" } })).toEqual(
      [],
    );
  });
});
