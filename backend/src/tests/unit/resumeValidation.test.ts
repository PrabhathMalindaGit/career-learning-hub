import { describe, expect, it } from "vitest";
import {
  normalizeResumeContent,
  normalizeResumeUrlInput,
} from "../../modules/resumes/resume.validation.js";

describe("Resume URL validation", () => {
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

  it("normalizes nested Resume URLs at the backend trust boundary", () => {
    const normalized = normalizeResumeContent({
      basics: {
        fullName: "Synthetic Candidate",
        links: [{ label: "GitHub", url: " github.com/example " }],
      },
      experience: [],
      education: [],
      skills: [],
      projects: [{
        name: "Synthetic Project",
        technologies: [],
        links: [{ label: "Project", url: "example.test/project" }],
        bullets: [],
      }],
      certifications: [{
        name: "Synthetic Credential",
        credentialUrl: " credentials.example.test/verified ",
      }],
      languages: [],
      interests: [],
    });

    expect(normalized.basics.links[0]!.url).toBe(
      "https://github.com/example",
    );
    expect(normalized.projects[0]!.links[0]!.url).toBe(
      "https://example.test/project",
    );
    expect(normalized.certifications[0]!.credentialUrl).toBe(
      "https://credentials.example.test/verified",
    );
  });

  it.each(["javascript:alert(1)", "ftp://example.test/file", "not a url"])(
    "rejects unsafe or malformed canonical Link input %s",
    (url) => {
      expect(() =>
        normalizeResumeContent({
          basics: {
            fullName: "Synthetic Candidate",
            links: [{ label: "Unsafe", url }],
          },
          experience: [],
          education: [],
          skills: [],
          projects: [],
          certifications: [],
          languages: [],
          interests: [],
        }),
      ).toThrow();
    },
  );
});
