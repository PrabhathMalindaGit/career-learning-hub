import type {
  ResumeContent,
  ResumeDesign,
} from "./types";

interface ResumePreviewProps {
  content: ResumeContent;
  design: ResumeDesign;
}

export function ResumePreview({
  content,
  design,
}: ResumePreviewProps) {
  return (
    <section
      className="resume-panel resume-preview-panel"
      aria-labelledby="resume-preview-title"
    >
      <header className="resume-panel-header">
        <div>
          <p className="resume-kicker">Design</p>
          <h2 id="resume-preview-title">Live preview</h2>
        </div>
        <span className="resume-status">{design.pageSize}</span>
      </header>

      <article
        className="resume-paper"
        data-template={design.templateId}
        aria-label="Resume preview"
      >
        <header className="resume-paper-header">
          <h3>{content.basics.fullName || "Your name"}</h3>
          <p>{content.basics.headline || "Professional headline"}</p>
          <small>
            {[
              content.basics.email,
              content.basics.phone,
              content.basics.location,
            ]
              .filter(Boolean)
              .join(" • ") || "Contact details"}
          </small>
        </header>

        <section>
          <h4>Summary</h4>
          <p>
            {content.basics.summary ||
              "Your professional summary will appear here."}
          </p>
        </section>

        <section>
          <h4>Experience</h4>
          {content.experience.length === 0 ? (
            <p className="resume-muted">Add experience in the editor.</p>
          ) : (
            content.experience.map((entry) => (
              <div className="resume-preview-entry" key={entry.id}>
                <strong>{entry.jobTitle}</strong>
                <span>{entry.employer}</span>
                <ul>
                  {entry.bullets.map((bullet) => (
                    <li key={bullet.id}>{bullet.text}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </article>
    </section>
  );
}
