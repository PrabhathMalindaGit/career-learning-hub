import { describe, expect, it } from "vitest";
import {
  INTERVIEW_CAREER_AREAS,
  INTERVIEW_EXPERIENCE_LEVELS,
  OTHER_CUSTOM_CAREER_AREA,
  getInterviewCareerGuidance,
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

  it("exposes the fourteen canonical career areas in stable order", () => {
    expect(INTERVIEW_CAREER_AREAS.map((area) => area.label)).toEqual([
      "Technology & IT",
      "Business & Management",
      "Finance & Accounting",
      "Marketing & Sales",
      "Human Resources",
      "Healthcare",
      "Engineering",
      "Education & Training",
      "Law & Legal Services",
      "Design & Creative",
      "Operations & Supply Chain",
      "Customer Service & Hospitality",
      "Science & Research",
      "Public Service & Administration",
    ]);
    expect(OTHER_CUSTOM_CAREER_AREA).toBe("other-custom");
  });

  it("keeps representative roles local to each career area", () => {
    expect(getInterviewCareerGuidance("technology-it").roles).toContain(
      "Software Engineer",
    );
    expect(getInterviewCareerGuidance("finance-accounting").roles).toContain(
      "Accountant",
    );
    expect(getInterviewCareerGuidance("healthcare").roles).toContain("Nurse");
    expect(getInterviewCareerGuidance("engineering").roles).toContain(
      "Civil Engineer",
    );
    expect(getInterviewCareerGuidance("education-training").roles).toContain(
      "Teacher",
    );
  });

  it("waits for an area and gives Other / Custom generic professional guidance", () => {
    expect(getInterviewCareerGuidance("")).toEqual({
      roles: [],
      focusTopics: [],
      skillGaps: [],
    });

    const custom = getInterviewCareerGuidance("other-custom");
    expect(custom.roles).toEqual([]);
    expect(custom.focusTopics).toContain("Role Knowledge");
    expect(custom.skillGaps).toContain("Interview Communication");
    expect(custom.focusTopics).not.toContain("Software & Systems");
  });

  it("keeps every canonical guidance list bounded and duplicate-free", () => {
    for (const area of INTERVIEW_CAREER_AREAS) {
      expect(area.roles.length).toBeGreaterThan(0);
      expect(area.focusTopics).toHaveLength(8);
      expect(area.skillGaps).toHaveLength(8);
      expect(new Set(area.roles).size).toBe(area.roles.length);
      expect(new Set(area.focusTopics).size).toBe(area.focusTopics.length);
      expect(new Set(area.skillGaps).size).toBe(area.skillGaps.length);
      expect(getInterviewCareerGuidance(area.id)).toEqual({
        roles: area.roles,
        focusTopics: area.focusTopics,
        skillGaps: area.skillGaps,
      });
    }
  });

  it("creates a deterministic role-and-level title only when both values exist", () => {
    expect(suggestInterviewTitle("Accountant", "Mid-level")).toBe(
      "Mid-level Accountant Interview",
    );
    expect(suggestInterviewTitle("  Nurse  ", " Senior ")).toBe(
      "Senior Nurse Interview",
    );
    expect(suggestInterviewTitle("", "Mid-level")).toBe("");
    expect(suggestInterviewTitle("Teacher", "")).toBe("");
  });
});
