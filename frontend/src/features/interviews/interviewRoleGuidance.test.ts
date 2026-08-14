import { describe, expect, it } from "vitest";
import {
  INTERVIEW_EXPERIENCE_LEVELS,
  INTERVIEW_ROLE_OPTIONS,
  getInterviewRoleSuggestions,
  matchInterviewRoleFamily,
  suggestInterviewTitle,
} from "./interviewRoleGuidance";

describe("interviewRoleGuidance", () => {
  it("exposes the approved experience levels in stable order", () => {
    expect(INTERVIEW_EXPERIENCE_LEVELS).toEqual([
      "Intern / Student",
      "Entry-level",
      "Junior",
      "Mid-level",
      "Senior",
      "Lead / Staff",
      "Manager",
    ]);
  });

  it("exposes all ten common roles with duplicate-free guidance", () => {
    expect(INTERVIEW_ROLE_OPTIONS.map((option) => option.label)).toEqual([
      "Software Engineer",
      "Frontend Developer",
      "Backend Developer",
      "Full-Stack Developer",
      "Mobile Developer",
      "DevOps / Cloud Engineer",
      "Data Engineer",
      "ML / AI Engineer",
      "Cybersecurity Engineer",
      "QA / Test Engineer",
    ]);

    for (const option of INTERVIEW_ROLE_OPTIONS) {
      expect(option.focusTopics.length).toBeGreaterThan(0);
      expect(option.skillGaps.length).toBeGreaterThan(0);
      expect(new Set(option.focusTopics).size).toBe(option.focusTopics.length);
      expect(new Set(option.skillGaps).size).toBe(option.skillGaps.length);
    }
  });

  it("matches representative custom roles to deterministic local families", () => {
    expect(matchInterviewRoleFamily("MERN Developer")).toBe("full-stack");
    expect(matchInterviewRoleFamily("React Native Engineer")).toBe("mobile");
    expect(matchInterviewRoleFamily("LLM Engineer")).toBe("ml-ai");
    expect(matchInterviewRoleFamily("Cloud Platform Engineer")).toBe(
      "devops-cloud",
    );
    expect(matchInterviewRoleFamily("Penetration Tester")).toBe(
      "cybersecurity",
    );
    expect(matchInterviewRoleFamily("Unusual Internal Tools Specialist")).toBe(
      "software-engineer",
    );
  });

  it("waits for a role and then returns role-aware suggestions locally", () => {
    expect(getInterviewRoleSuggestions("")).toEqual({
      focusTopics: [],
      skillGaps: [],
    });

    const backend = getInterviewRoleSuggestions("Backend Developer");
    expect(backend.focusTopics).toContain("REST APIs");
    expect(backend.skillGaps).toContain("Database Optimization");

    const customAi = getInterviewRoleSuggestions("LLM Engineer");
    expect(customAi.focusTopics).toContain("LLMs");
    expect(customAi.skillGaps).toContain("LLM Evaluation");
  });

  it("creates a deterministic role-and-level title only when both values exist", () => {
    expect(suggestInterviewTitle("Backend Developer", "Mid-level")).toBe(
      "Mid-level Backend Developer Interview",
    );
    expect(suggestInterviewTitle("  Backend Developer  ", " Senior ")).toBe(
      "Senior Backend Developer Interview",
    );
    expect(suggestInterviewTitle("", "Mid-level")).toBe("");
    expect(suggestInterviewTitle("Backend Developer", "")).toBe("");
  });
});
