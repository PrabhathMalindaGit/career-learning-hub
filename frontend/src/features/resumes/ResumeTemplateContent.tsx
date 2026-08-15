import type { ResumeDraft } from "./types";

export type ResumeEntryLayout = "standard" | "technical-rail";
export type ResumeIdentityVariant = "classic" | "modern" | "technical";

function safeHref(value: string): string | undefined {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" ||
      parsed.protocol === "http:" ||
      parsed.protocol === "mailto:" ||
      parsed.protocol === "tel:"
      ? value.trim()
      : undefined;
  } catch {
    return undefined;
  }
}

function SafeLink({ href, children }: { href: string; children: string }) {
  const safe = safeHref(href);
  if (!safe) return <>{children}</>;
  const external = safe.startsWith("http://") || safe.startsWith("https://");
  return (
    <a
      href={safe}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  );
}

function DateSpan({
  start,
  end,
  current,
  className,
}: {
  start?: string;
  end?: string;
  current?: boolean;
  className?: string;
}) {
  const value = [start, current ? "Present" : end].filter(Boolean).join(" – ");
  return value ? <small className={className}>{value}</small> : null;
}

export function ResumeIdentityHeader({
  draft,
  variant,
  showCandidatePhoto,
  candidatePhotoUrl,
}: {
  draft: ResumeDraft;
  variant: ResumeIdentityVariant;
  showCandidatePhoto: boolean;
  candidatePhotoUrl?: string;
}) {
  return (
    <header className="resume-paper-header" data-resume-identity={variant}>
      <div className="resume-paper-identity">
        <div className="resume-paper-identity-copy">
          <h3>{draft.basics.fullName || "Your name"}</h3>
          {draft.basics.headline ? <p>{draft.basics.headline}</p> : null}
          {draft.basics.email || draft.basics.phone || draft.basics.location ? (
            <ul className="resume-paper-contact">
              {draft.basics.email ? (
                <li>
                  <SafeLink href={`mailto:${draft.basics.email}`}>
                    {draft.basics.email}
                  </SafeLink>
                </li>
              ) : null}
              {draft.basics.phone ? (
                <li>
                  <SafeLink href={`tel:${draft.basics.phone}`}>
                    {draft.basics.phone}
                  </SafeLink>
                </li>
              ) : null}
              {draft.basics.location ? <li>{draft.basics.location}</li> : null}
            </ul>
          ) : null}
          {draft.basics.links.length > 0 ? (
            <ul className="resume-paper-links">
              {draft.basics.links.map((link) => (
                <li key={link.clientKey}>
                  <SafeLink href={link.url}>{link.label}</SafeLink>: {link.url}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {showCandidatePhoto && candidatePhotoUrl ? (
          <div className="resume-profile-photo-frame" aria-hidden="true">
            <img
              className="resume-profile-photo"
              src={candidatePhotoUrl}
              alt=""
            />
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function ResumeSummarySection({ draft }: { draft: ResumeDraft }) {
  if (!draft.basics.summary) return null;
  return (
    <section data-resume-section="summary">
      <h4>Summary</h4>
      <p>{draft.basics.summary}</p>
    </section>
  );
}

export function ResumeExperienceSection({
  draft,
  entryLayout = "standard",
}: {
  draft: ResumeDraft;
  entryLayout?: ResumeEntryLayout;
}) {
  if (draft.experience.length === 0) return null;
  return (
    <section data-resume-section="experience">
      <h4>Experience</h4>
      {draft.experience.map((entry) => (
        <div
          className={`resume-preview-entry${
            entryLayout === "technical-rail"
              ? " resume-preview-entry--technical-rail"
              : ""
          }`}
          key={entry.clientKey}
        >
          <div className="resume-preview-entry-heading">
            <strong className="resume-preview-entry-title">
              {entry.jobTitle || "Job title"}
            </strong>
            <DateSpan
              start={entry.startDate}
              end={entry.endDate}
              current={entry.isCurrent}
              className="resume-preview-entry-date"
            />
          </div>
          <span className="resume-preview-entry-meta">
            {[entry.employer || "Employer", entry.location]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {entry.bullets.length > 0 ? (
            <ul className="resume-preview-entry-details">
              {entry.bullets.map((bullet) => (
                <li key={bullet.clientKey}>{bullet.text}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  );
}

export function ResumeEducationSection({ draft }: { draft: ResumeDraft }) {
  if (draft.education.length === 0) return null;
  return (
    <section data-resume-section="education">
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
  );
}

export function ResumeSkillsSection({ draft }: { draft: ResumeDraft }) {
  if (draft.skills.length === 0) return null;
  return (
    <section data-resume-section="skills">
      <h4>Skills</h4>
      <dl className="resume-paper-definition-list resume-paper-skills">
        {draft.skills.map((group) => (
          <div key={group.clientKey}>
            <dt>
              {group.name || "Skill group"}
              {group.keywords.length > 0 ? ":" : ""}
            </dt>
            {group.keywords.length > 0 ? (
              <dd>{group.keywords.join(", ")}</dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ResumeProjectsSection({
  draft,
  entryLayout = "standard",
}: {
  draft: ResumeDraft;
  entryLayout?: ResumeEntryLayout;
}) {
  if (draft.projects.length === 0) return null;
  return (
    <section data-resume-section="projects">
      <h4>Projects</h4>
      {draft.projects.map((project) => (
        <div
          className={`resume-preview-entry${
            entryLayout === "technical-rail"
              ? " resume-preview-entry--technical-rail"
              : ""
          }`}
          key={project.clientKey}
        >
          <div className="resume-preview-entry-heading">
            <strong className="resume-preview-entry-title">
              {project.name || "Project"}
            </strong>
            <DateSpan
              start={project.startDate}
              end={project.endDate}
              className="resume-preview-entry-date"
            />
          </div>
          {project.role ? (
            <span className="resume-preview-entry-meta">{project.role}</span>
          ) : null}
          {project.description ? (
            <p className="resume-preview-entry-description">{project.description}</p>
          ) : null}
          {project.technologies.length > 0 ? (
            <small className="resume-preview-entry-technologies">
              {project.technologies.join(", ")}
            </small>
          ) : null}
          {project.links.length > 0 ? (
            <ul className="resume-paper-links resume-preview-entry-links">
              {project.links.map((link) => (
                <li key={link.clientKey}>
                  <SafeLink href={link.url}>{link.label}</SafeLink>: {link.url}
                </li>
              ))}
            </ul>
          ) : null}
          {project.bullets.length > 0 ? (
            <ul className="resume-preview-entry-details">
              {project.bullets.map((bullet) => (
                <li key={bullet.clientKey}>{bullet.text}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </section>
  );
}

export function ResumeCertificationsSection({ draft }: { draft: ResumeDraft }) {
  if (draft.certifications.length === 0) return null;
  return (
    <section data-resume-section="certifications">
      <h4>Certifications</h4>
      <ul className="resume-paper-compact-list">
        {draft.certifications.map((certification) => (
          <li key={certification.clientKey}>
            <strong>{certification.name || "Certification"}</strong>
            {[certification.issuer, certification.issuedDate]
              .filter(Boolean)
              .map((value) => ` · ${value}`)
              .join("")}
            {certification.credentialUrl ? (
              <>
                {" · "}
                <SafeLink href={certification.credentialUrl}>Credential</SafeLink>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResumeLanguagesSection({ draft }: { draft: ResumeDraft }) {
  if (draft.languages.length === 0) return null;
  return (
    <section data-resume-section="languages">
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
  );
}

export function ResumeInterestsSection({ draft }: { draft: ResumeDraft }) {
  if (draft.interests.length === 0) return null;
  return (
    <section data-resume-section="interests">
      <h4>Interests</h4>
      <p>{draft.interests.map((item) => item.value).join(" · ")}</p>
    </section>
  );
}
