import { describe, expect, it } from "vitest";
import {
  createDraftEntity,
  draftToInput,
  resumeContentToDraft,
  validateResumeDraft,
} from "./resumeDraft";
import type { ResumeContent } from "./types";

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
        "Experience 2 needs an employer.",
        "Experience 2 needs a job title.",
      ]),
    );
  });

  it("rejects an invalid optional email before save", () => {
    const draft = resumeContentToDraft(content());
    draft.basics.email = "invalid-email";

    expect(validateResumeDraft(draft)).toContain(
      "Email needs a valid address.",
    );
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
        "Project 1, link 1 needs a valid URL.",
        "Certification 1 needs a valid credential URL.",
      ]),
    );
  });
});
