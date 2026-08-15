import { describe, expect, it } from "vitest";
import { normalizeResumeContent } from "../../modules/resumes/resume.validation.js";

function ownKeys(value: object): string[] {
  return Object.keys(value).sort();
}

describe("Resume PDF import response contract", () => {
  it("omits undefined optional fields from canonical Resume content before job persistence", () => {
    const content = normalizeResumeContent({
      basics: {
        fullName: "Synthetic Candidate",
        email: undefined,
        phone: undefined,
        location: undefined,
        headline: undefined,
        summary: undefined,
        links: [],
      },
      experience: [
        {
          employer: "Example Company",
          jobTitle: "Engineer",
          location: undefined,
          startDate: undefined,
          endDate: undefined,
          isCurrent: false,
          bullets: [],
        },
      ],
      education: [
        {
          institution: "Example University",
          qualification: "BSc",
          fieldOfStudy: undefined,
          location: undefined,
          startDate: undefined,
          endDate: undefined,
          isCurrent: false,
          details: [],
        },
      ],
      skills: [],
      projects: [
        {
          name: "Synthetic Project",
          role: undefined,
          description: undefined,
          startDate: undefined,
          endDate: undefined,
          technologies: [],
          links: [],
          bullets: [],
        },
      ],
      certifications: [
        {
          name: "Synthetic Certification",
          issuer: undefined,
          issuedDate: undefined,
          credentialUrl: undefined,
        },
      ],
      languages: [
        {
          name: "English",
          proficiency: undefined,
        },
      ],
      interests: [],
    });

    expect(ownKeys(content.basics)).toEqual(["fullName", "links"]);
    expect(ownKeys(content.experience[0]!)).toEqual([
      "bullets",
      "employer",
      "id",
      "isCurrent",
      "jobTitle",
    ]);
    expect(ownKeys(content.education[0]!)).toEqual([
      "details",
      "id",
      "institution",
      "isCurrent",
      "qualification",
    ]);
    expect(ownKeys(content.projects[0]!)).toEqual([
      "bullets",
      "id",
      "links",
      "name",
      "technologies",
    ]);
    expect(ownKeys(content.certifications[0]!)).toEqual(["id", "name"]);
    expect(ownKeys(content.languages[0]!)).toEqual(["id", "name"]);
  });
});
