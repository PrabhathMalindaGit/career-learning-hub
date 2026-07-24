import type { ResumeDraft } from "./types";

interface ResumePreviewProps {
  draft: ResumeDraft;
  label?: string;
  headingId?: string;
  ariaLabel?: string;
}

function DateSpan({
  start,
  end,
  current,
}: {
  start?: string;
  end?: string;
  current?: boolean;
}) {
  const value = [start, current ? "Present" : end]
    .filter(Boolean)
    .join(" – ");
  return value ? <small>{value}</small> : null;
}

export function ResumePreview({
  draft,
  label = "Live preview",
  headingId = "resume-preview-title",
  ariaLabel = "Resume preview",
}: ResumePreviewProps) {
  const contact = [
    draft.basics.email,
    draft.basics.phone,
    draft.basics.location,
  ].filter(Boolean);

  return (
    <section
      className="resume-panel resume-preview-panel"
      aria-labelledby={headingId}
    >
      <header className="resume-panel-header">
        <div>
          <p className="resume-kicker">ATS Classic</p>
          <h2 id={headingId}>{label}</h2>
        </div>
        <span className="resume-status">A4</span>
      </header>

      <article
        className="resume-paper"
        data-template="ats-classic"
        aria-label={ariaLabel}
      >
        <header className="resume-paper-header">
          <h3>{draft.basics.fullName || "Your name"}</h3>
          {draft.basics.headline ? <p>{draft.basics.headline}</p> : null}
          {contact.length > 0 ? <small>{contact.join(" • ")}</small> : null}
          {draft.basics.links.length > 0 ? (
            <ul className="resume-paper-links">
              {draft.basics.links.map((link) => (
                <li key={link.clientKey}>
                  {link.label}: {link.url}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        {draft.basics.summary ? (
          <section>
            <h4>Summary</h4>
            <p>{draft.basics.summary}</p>
          </section>
        ) : null}

        {draft.experience.length > 0 ? (
          <section>
            <h4>Experience</h4>
            {draft.experience.map((entry) => (
              <div className="resume-preview-entry" key={entry.clientKey}>
                <div className="resume-preview-entry-heading">
                  <strong>{entry.jobTitle || "Job title"}</strong>
                  <DateSpan
                    start={entry.startDate}
                    end={entry.endDate}
                    current={entry.isCurrent}
                  />
                </div>
                <span>
                  {[entry.employer || "Employer", entry.location]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {entry.bullets.length > 0 ? (
                  <ul>
                    {entry.bullets.map((bullet) => (
                      <li key={bullet.clientKey}>{bullet.text}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {draft.education.length > 0 ? (
          <section>
            <h4>Education</h4>
            {draft.education.map((entry) => (
              <div className="resume-preview-entry" key={entry.clientKey}>
                <div className="resume-preview-entry-heading">
                  <strong>{entry.qualification || "Qualification"}</strong>
                  <DateSpan
                    start={entry.startDate}
                    end={entry.endDate}
                    current={entry.isCurrent}
                  />
                </div>
                <span>
                  {[
                    entry.institution || "Institution",
                    entry.fieldOfStudy,
                    entry.location,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {entry.details.length > 0 ? (
                  <ul>
                    {entry.details.map((detail) => (
                      <li key={detail.clientKey}>{detail.text}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {draft.skills.length > 0 ? (
          <section>
            <h4>Skills</h4>
            <dl className="resume-paper-definition-list">
              {draft.skills.map((group) => (
                <div key={group.clientKey}>
                  <dt>{group.name || "Skill group"}</dt>
                  <dd>{group.keywords.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {draft.projects.length > 0 ? (
          <section>
            <h4>Projects</h4>
            {draft.projects.map((project) => (
              <div className="resume-preview-entry" key={project.clientKey}>
                <div className="resume-preview-entry-heading">
                  <strong>{project.name || "Project"}</strong>
                  <DateSpan
                    start={project.startDate}
                    end={project.endDate}
                  />
                </div>
                {project.role ? <span>{project.role}</span> : null}
                {project.description ? <p>{project.description}</p> : null}
                {project.technologies.length > 0 ? (
                  <small>{project.technologies.join(", ")}</small>
                ) : null}
                {project.links.length > 0 ? (
                  <ul className="resume-paper-links">
                    {project.links.map((link) => (
                      <li key={link.clientKey}>
                        {link.label}: {link.url}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {project.bullets.length > 0 ? (
                  <ul>
                    {project.bullets.map((bullet) => (
                      <li key={bullet.clientKey}>{bullet.text}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {draft.certifications.length > 0 ? (
          <section>
            <h4>Certifications</h4>
            <ul className="resume-paper-compact-list">
              {draft.certifications.map((certification) => (
                <li key={certification.clientKey}>
                  <strong>{certification.name || "Certification"}</strong>
                  {[
                    certification.issuer,
                    certification.issuedDate,
                    certification.credentialUrl,
                  ]
                    .filter(Boolean)
                    .map((value) => ` · ${value}`)
                    .join("")}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {draft.languages.length > 0 ? (
          <section>
            <h4>Languages</h4>
            <p>
              {draft.languages
                .map((language) =>
                  [language.name || "Language", language.proficiency]
                    .filter(Boolean)
                    .join(" — "),
                )
                .join(" · ")}
            </p>
          </section>
        ) : null}

        {draft.interests.length > 0 ? (
          <section>
            <h4>Interests</h4>
            <p>{draft.interests.map((item) => item.value).join(" · ")}</p>
          </section>
        ) : null}
      </article>
    </section>
  );
}
