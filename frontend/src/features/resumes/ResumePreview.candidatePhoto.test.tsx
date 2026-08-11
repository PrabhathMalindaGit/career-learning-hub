import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resumeContentToDraft } from "./resumeDraft";
import { ResumePreview } from "./ResumePreview";
import type { ResumeContent, ResumeDesign } from "./types";

const content: ResumeContent = {
  basics: {
    fullName: "Synthetic Candidate",
    email: "candidate@example.test",
    links: [],
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
};

function design(templateId: string, showProfilePhoto: boolean): ResumeDesign {
  return {
    templateId,
    colorPaletteId: "slate",
    pageSize: "A4",
    fontFamily: "Inter",
    showProfilePhoto,
  };
}

describe("ResumePreview Candidate Photo", () => {
  it.each(["ats-classic", "modern-professional", "compact-technical"])(
    "renders the current Candidate Photo in %s with empty alt text",
    (templateId) => {
      const { container } = render(
        <ResumePreview
          draft={resumeContentToDraft(content)}
          design={design(templateId, true)}
          candidatePhotoUrl="blob:canonical-photo"
        />,
      );

      const image = container.querySelector(".resume-profile-photo");
      expect(image).not.toBeNull();
      expect(image?.getAttribute("src")).toBe("blob:canonical-photo");
      expect(image?.getAttribute("alt")).toBe("");
      expect(container.querySelector('[aria-hidden="true"] .resume-profile-photo')).not.toBeNull();
    },
  );

  it("does not render a stored hidden Candidate Photo", () => {
    const { container } = render(
      <ResumePreview
        draft={resumeContentToDraft(content)}
        design={design("ats-classic", false)}
        candidatePhotoUrl="blob:canonical-photo"
      />,
    );
    expect(container.querySelector(".resume-profile-photo")).toBeNull();
  });

  it("does not render a visible preference without a canonical source", () => {
    const { container } = render(
      <ResumePreview
        draft={resumeContentToDraft(content)}
        design={design("ats-classic", true)}
      />,
    );
    expect(container.querySelector(".resume-profile-photo")).toBeNull();
  });
});
