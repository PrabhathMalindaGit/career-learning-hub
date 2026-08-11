import type { ResumeDesign, ResumeDraft } from "./types";
import {
  DEFAULT_RESUME_FONT,
  DEFAULT_RESUME_PALETTE,
  DEFAULT_RESUME_TEMPLATE,
  resolveResumePresentation,
} from "./resumeTemplateRegistry";
import "./resumeCandidatePhoto.css";

interface ResumePreviewProps {
  draft: ResumeDraft;
  label?: string;
  headingId?: string;
  ariaLabel?: string;
  pageSize?: ResumeDesign["pageSize"];
  design?: ResumeDesign;
  candidatePhotoUrl?: string;
  printOnly?: boolean;
}

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

function SafeLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
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
  pageSize,
  design,
  candidatePhotoUrl,
  printOnly = false,
}: ResumePreviewProps) {
  const resolved = resolveResumePresentation(
    design ?? {
      templateId: DEFAULT_RESUME_TEMPLATE.id,
      fontFamily: DEFAULT_RESUME_FONT.value,
      colorPaletteId: DEFAULT_RESUME_PALETTE.id,
    },
  );
  const effectivePageSize = pageSize ?? design?.pageSize ?? "A4";
  const showCandidatePhoto =
    design?.showProfilePhoto === true && candidatePhotoUrl !== undefined;

  return (
    <section
      className={`resume-panel resume-preview-panel${
        printOnly ? " resume-print-surface" : ""
      }`}
      {...(printOnly
        ? { "aria-label": label }
        : { "aria-labelledby": headingId })}
      tabIndex={printOnly ? undefined : 0}
      data-page-size={effectivePageSize}
    >
      {printOnly ? (
        <style>{`@media print { @page { size: ${
          effectivePageSize === "LETTER" ? "Letter" : "A4"
        }; margin: 12mm; } }`}</style>
      ) : (
        <header className="resume-panel-header">
          <div>
            <p className="resume-kicker">{resolved.template.option.label}</p>
            <h2 id={headingId}>{label}</h2>
          </div>
          <span className="resume-status">
            {effectivePageSize === "LETTER" ? "Letter" : "A4"}
          </span>
        </header>
      )}

      <article
        className={`resume-paper ${resolved.template.option.className} ${resolved.font.option.className} ${resolved.palette.option.className}`}
        data-template={resolved.template.option.id}
        data-font={resolved.font.option.value}
        data-palette={resolved.palette.option.id}
        aria-label={ariaLabel}
      >
        <header className="resume-paper-header">
          <div className="resume-paper-identity">
            <div className="resume-paper-identity-copy">
              <h3>{draft.basics.fullName || "Your name"}</h3>
              {draft.basics.headline ? <p>{draft.basics.headline}</p> : null}
              {draft.basics.email ||
              draft.basics.phone ||
              draft.basics.location ? (
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
                  {draft.basics.location ? (
                    <li>{draft.basics.location}</li>
                  ) : null}
                </ul>
              ) : null}
              {draft.basics.links.length > 0 ? (
                <ul className="resume-paper-links">
                  {draft.basics.links.map((link) => (
                    <li key={link.clientKey}>
                      <SafeLink href={link.url}>{link.label}</SafeLink>:{" "}
                      {link.url}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {showCandidatePhoto ? (
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
                        <SafeLink href={link.url}>{link.label}</SafeLink>:{" "}
                        {link.url}
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
                  ]
                    .filter(Boolean)
                    .map((value) => ` · ${value}`)
                    .join("")}
                  {certification.credentialUrl ? (
                    <>
                      {" · "}
                      <SafeLink href={certification.credentialUrl}>
                        Credential
                      </SafeLink>
                    </>
                  ) : null}
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
