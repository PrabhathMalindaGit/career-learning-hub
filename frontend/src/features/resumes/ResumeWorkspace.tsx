import { useMemo, useState } from "react";
import { AiRecommendations } from "./AiRecommendations";
import { ResumeEditor } from "./ResumeEditor";
import { ResumePreview } from "./ResumePreview";
import type {
  ResumeContent,
  ResumeDesign,
  ResumeSuggestion,
} from "./types";
import "./resumeWorkspace.css";

const starterContent: ResumeContent = {
  basics: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
    summary: "",
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

const starterDesign: ResumeDesign = {
  templateId: "ats-classic",
  colorPaletteId: "slate",
  pageSize: "A4",
  fontFamily: "Inter",
  showProfilePhoto: false,
};

interface ResumeWorkspaceProps {
  initialContent?: ResumeContent;
  initialDesign?: ResumeDesign;
  suggestions?: ResumeSuggestion[];
  readinessScore?: number;
}

export function ResumeWorkspace({
  initialContent = starterContent,
  initialDesign = starterDesign,
  suggestions = [],
  readinessScore,
}: ResumeWorkspaceProps) {
  const [content, setContent] = useState(initialContent);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectedSuggestionIds = useMemo(
    () => new Set(selected),
    [selected],
  );

  const toggleSuggestion = (suggestionId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(suggestionId)) {
        next.delete(suggestionId);
      } else {
        next.add(suggestionId);
      }
      return next;
    });
  };

  return (
    <section
      className="resume-workspace"
      aria-label="Resume Studio workspace"
    >
      <div className="resume-workspace-heading">
        <div>
          <p className="eyebrow">Phase 4</p>
          <h2>Resume Studio</h2>
          <p>
            Edit canonical resume content, preview the selected design, and
            review AI suggestions in one workspace.
          </p>
        </div>
        <button type="button" className="resume-primary-button">
          Save new version
        </button>
      </div>

      <div className="resume-workspace-grid">
        <ResumeEditor content={content} onChange={setContent} />
        <ResumePreview content={content} design={initialDesign} />
        <AiRecommendations
          readinessScore={readinessScore}
          suggestions={suggestions}
          selectedSuggestionIds={selectedSuggestionIds}
          onToggleSuggestion={toggleSuggestion}
          onApplySelected={() => {
            console.info("Selected suggestion IDs", [...selected]);
          }}
        />
      </div>
    </section>
  );
}
