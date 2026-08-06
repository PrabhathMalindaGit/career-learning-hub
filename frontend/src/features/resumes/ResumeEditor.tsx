import { Link } from "react-router-dom";

import {
  createDraftEntity,
  resumeFieldId,
  type ResumeDraftValidationError,
} from "./resumeDraft";
import type {
  DraftBullet,
  DraftLink,
  ResumeDraft,
} from "./types";

interface ResumeEditorProps {
  draft: ResumeDraft;
  onChange(draft: ResumeDraft): void;
  disabled?: boolean;
  validationErrors?: readonly ResumeDraftValidationError[];
}

const RESUME_EDITOR_SECTIONS = [
  { id: "resume-section-basics", label: "Basics" },
  { id: "resume-section-links", label: "Links" },
  { id: "resume-section-experience", label: "Experience" },
  { id: "resume-section-education", label: "Education" },
  { id: "resume-section-skills", label: "Skills" },
  { id: "resume-section-projects", label: "Projects" },
  { id: "resume-section-certifications", label: "Certifications" },
  { id: "resume-section-languages", label: "Languages" },
  { id: "resume-section-interests", label: "Interests" },
] as const;

function focusResumeSection(sectionId: string) {
  window.requestAnimationFrame(() => {
    const section = document.getElementById(sectionId);
    if (typeof section?.scrollIntoView === "function") {
      section.scrollIntoView({ block: "start" });
    }
    document
      .getElementById(`${sectionId}-heading`)
      ?.focus({ preventScroll: true });
  });
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function MoveButtons({
  label,
  index,
  count,
  onMove,
  onRemove,
  disabled,
}: {
  label: string;
  index: number;
  count: number;
  onMove(from: number, to: number): void;
  onRemove(): void;
  disabled: boolean;
}) {
  return (
    <div className="resume-entry-controls">
      <button
        type="button"
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label={`Move ${label} up`}
      >
        Up
      </button>
      <button
        type="button"
        disabled={disabled || index === count - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label={`Move ${label} down`}
      >
        Down
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        Remove
      </button>
    </div>
  );
}

function SectionHeading({
  headingId,
  title,
  description,
  addLabel,
  onAdd,
  disabled,
}: {
  headingId: string;
  title: string;
  description: string;
  addLabel: string;
  onAdd(): void;
  disabled: boolean;
}) {
  return (
    <header className="resume-editor-section-heading">
      <div>
        <h3 id={headingId} tabIndex={-1}>{title}</h3>
        <p>{description}</p>
      </div>
      <button type="button" disabled={disabled} onClick={onAdd}>
        {addLabel}
      </button>
    </header>
  );
}

function EmptySection({ children }: { children: string }) {
  return <p className="resume-editor-empty">{children}</p>;
}

export function ResumeEditor({
  draft,
  onChange,
  disabled = false,
  validationErrors = [],
}: ResumeEditorProps) {
  const errorByPath = new Map(
    validationErrors.map((error) => [error.path, error.message]),
  );
  const fieldAttributes = (path: string) => {
    const error = errorByPath.get(path);
    return {
      id: resumeFieldId(path),
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error
        ? `${resumeFieldId(path)}-error`
        : undefined,
    };
  };
  const fieldError = (path: string) => {
    const error = errorByPath.get(path);
    return error ? (
      <span
        className="resume-field-error"
        id={`${resumeFieldId(path)}-error`}
      >
        {error}
      </span>
    ) : null;
  };
  const mutate = (change: (next: ResumeDraft) => void) => {
    const next = structuredClone(draft);
    change(next);
    onChange(next);
  };
  const move = <T,>(items: T[], from: number, to: number) => {
    const [item] = items.splice(from, 1);
    if (item !== undefined) items.splice(to, 0, item);
  };
  const addLink = (links: DraftLink[]) =>
    links.push(createDraftEntity({ label: "", url: "" }));
  const addBullet = (bullets: DraftBullet[]) =>
    bullets.push(createDraftEntity({ text: "" }));

  return (
    <section
      className="resume-panel resume-editor"
      aria-labelledby="resume-editor-title"
    >
      <header className="resume-panel-header">
        <div>
          <p className="resume-kicker">Content</p>
          <h2 id="resume-editor-title">Resume editor</h2>
        </div>
        <span className="resume-status">Canonical fields</span>
      </header>

      <nav className="resume-section-navigation" aria-label="Resume sections">
        <ul>
          {RESUME_EDITOR_SECTIONS.map((section) => (
            <li key={section.id}>
              <Link
                to={`#${section.id}`}
                onClick={() => focusResumeSection(section.id)}
              >
                {section.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section
        id="resume-section-basics"
        className="resume-editor-section"
        aria-labelledby="resume-section-basics-heading"
      >
        <h3 id="resume-section-basics-heading" tabIndex={-1}>
          Basics
        </h3>
        <div className="resume-form-grid">
          <label>
            Full name
            <input
              disabled={disabled}
              maxLength={200}
              value={draft.basics.fullName}
              onChange={(event) =>
                mutate((next) => {
                  next.basics.fullName = event.target.value;
                })
              }
            />
          </label>
          <label>
            Headline
            <input
              disabled={disabled}
              maxLength={200}
              value={draft.basics.headline ?? ""}
              onChange={(event) =>
                mutate((next) => {
                  next.basics.headline = event.target.value;
                })
              }
            />
          </label>
          <label>
            Email
            <input
              {...fieldAttributes("basics.email")}
              aria-label="Email"
              disabled={disabled}
              type="email"
              maxLength={320}
              value={draft.basics.email ?? ""}
              onChange={(event) =>
                mutate((next) => {
                  next.basics.email = event.target.value;
                })
              }
            />
            {fieldError("basics.email")}
          </label>
          <label>
            Phone
            <input
              disabled={disabled}
              maxLength={80}
              value={draft.basics.phone ?? ""}
              onChange={(event) =>
                mutate((next) => {
                  next.basics.phone = event.target.value;
                })
              }
            />
          </label>
          <label className="resume-field-wide">
            Location
            <input
              disabled={disabled}
              maxLength={200}
              value={draft.basics.location ?? ""}
              onChange={(event) =>
                mutate((next) => {
                  next.basics.location = event.target.value;
                })
              }
            />
          </label>
          <label className="resume-field-wide">
            Professional summary
            <textarea
              disabled={disabled}
              maxLength={5_000}
              rows={5}
              value={draft.basics.summary ?? ""}
              onChange={(event) =>
                mutate((next) => {
                  next.basics.summary = event.target.value;
                })
              }
            />
          </label>
        </div>
      </section>

      <section
        id="resume-section-links"
        className="resume-editor-section"
        aria-labelledby="resume-section-links-heading"
      >
        <SectionHeading
          headingId="resume-section-links-heading"
          title="Links"
          description="Add labelled public links that belong on the resume."
          addLabel="Add link"
          disabled={disabled || draft.basics.links.length >= 20}
          onAdd={() => mutate((next) => addLink(next.basics.links))}
        />
        {draft.basics.links.length === 0 ? (
          <EmptySection>No links added.</EmptySection>
        ) : (
          draft.basics.links.map((link, index) => (
            <div className="resume-entry-card" key={link.clientKey}>
              <div className="resume-form-grid">
                <label>
                  Link {index + 1} label
                  <input
                    {...fieldAttributes(`links.${index}.label`)}
                    aria-label={`Link ${index + 1} label`}
                    disabled={disabled}
                    maxLength={80}
                    value={link.label}
                    onChange={(event) =>
                      mutate((next) => {
                        next.basics.links[index]!.label =
                          event.target.value;
                      })
                    }
                  />
                  {fieldError(`links.${index}.label`)}
                </label>
                <label>
                  Link {index + 1} URL
                  <input
                    {...fieldAttributes(`links.${index}.url`)}
                    aria-label={`Link ${index + 1} URL`}
                    disabled={disabled}
                    type="text"
                    inputMode="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={2_000}
                    value={link.url}
                    onChange={(event) =>
                      mutate((next) => {
                        next.basics.links[index]!.url =
                          event.target.value;
                      })
                    }
                  />
                  {fieldError(`links.${index}.url`)}
                </label>
              </div>
              <MoveButtons
                label={`link ${index + 1}`}
                index={index}
                count={draft.basics.links.length}
                disabled={disabled}
                onMove={(from, to) =>
                  mutate((next) => move(next.basics.links, from, to))
                }
                onRemove={() =>
                  mutate((next) => next.basics.links.splice(index, 1))
                }
              />
            </div>
          ))
        )}
      </section>

      <section
        id="resume-section-experience"
        className="resume-editor-section"
        aria-labelledby="resume-section-experience-heading"
      >
        <SectionHeading
          headingId="resume-section-experience-heading"
          title="Experience"
          description="Keep each role and its evidence-bearing bullets separate."
          addLabel="Add experience"
          disabled={disabled || draft.experience.length >= 50}
          onAdd={() =>
            mutate((next) =>
              next.experience.push(
                createDraftEntity({
                  employer: "",
                  jobTitle: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  isCurrent: false,
                  bullets: [],
                }),
              ),
            )
          }
        />
        {draft.experience.length === 0 ? (
          <EmptySection>No experience entries added.</EmptySection>
        ) : (
          draft.experience.map((entry, index) => (
            <article className="resume-entry-card" key={entry.clientKey}>
              <h4>Experience {index + 1}</h4>
              <div className="resume-form-grid">
                {(
                  [
                    ["Employer", "employer", 200],
                    ["Job title", "jobTitle", 200],
                    ["Location", "location", 200],
                    ["Start date", "startDate", 30],
                    ["End date", "endDate", 30],
                  ] as const
                ).map(([label, field, maximum]) => (
                  <label key={field}>
                    {label}
                    <input
                      {...fieldAttributes(`experience.${index}.${field}`)}
                      aria-label={label}
                      disabled={disabled}
                      maxLength={maximum}
                      value={entry[field] ?? ""}
                      onChange={(event) =>
                        mutate((next) => {
                          next.experience[index]![field] =
                            event.target.value;
                        })
                      }
                    />
                    {fieldError(`experience.${index}.${field}`)}
                  </label>
                ))}
                <label className="resume-checkbox-field">
                  <input
                    disabled={disabled}
                    type="checkbox"
                    checked={entry.isCurrent}
                    onChange={(event) =>
                      mutate((next) => {
                        next.experience[index]!.isCurrent =
                          event.target.checked;
                      })
                    }
                  />
                  Current role
                </label>
              </div>
              <div className="resume-bullet-list">
                {entry.bullets.map((bullet, bulletIndex) => (
                  <div className="resume-bullet-row" key={bullet.clientKey}>
                    <label>
                      Bullet {bulletIndex + 1}
                      <textarea
                        {...fieldAttributes(
                          `experience.${index}.bullets.${bulletIndex}.text`,
                        )}
                        aria-label={`Bullet ${bulletIndex + 1}`}
                        disabled={disabled}
                        maxLength={2_000}
                        rows={2}
                        value={bullet.text}
                        onChange={(event) =>
                          mutate((next) => {
                            next.experience[index]!.bullets[
                              bulletIndex
                            ]!.text = event.target.value;
                          })
                        }
                      />
                      {fieldError(
                        `experience.${index}.bullets.${bulletIndex}.text`,
                      )}
                    </label>
                    <MoveButtons
                      label={`experience ${index + 1} bullet ${bulletIndex + 1}`}
                      index={bulletIndex}
                      count={entry.bullets.length}
                      disabled={disabled}
                      onMove={(from, to) =>
                        mutate((next) =>
                          move(next.experience[index]!.bullets, from, to),
                        )
                      }
                      onRemove={() =>
                        mutate((next) =>
                          next.experience[index]!.bullets.splice(
                            bulletIndex,
                            1,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  disabled={disabled || entry.bullets.length >= 50}
                  onClick={() =>
                    mutate((next) =>
                      addBullet(next.experience[index]!.bullets),
                    )
                  }
                >
                  Add experience bullet
                </button>
              </div>
              <MoveButtons
                label={`experience ${index + 1}`}
                index={index}
                count={draft.experience.length}
                disabled={disabled}
                onMove={(from, to) =>
                  mutate((next) => move(next.experience, from, to))
                }
                onRemove={() =>
                  mutate((next) => next.experience.splice(index, 1))
                }
              />
            </article>
          ))
        )}
      </section>

      <section
        id="resume-section-education"
        className="resume-editor-section"
        aria-labelledby="resume-section-education-heading"
      >
        <SectionHeading
          headingId="resume-section-education-heading"
          title="Education"
          description="Record qualifications and supporting details."
          addLabel="Add education"
          disabled={disabled || draft.education.length >= 30}
          onAdd={() =>
            mutate((next) =>
              next.education.push(
                createDraftEntity({
                  institution: "",
                  qualification: "",
                  fieldOfStudy: "",
                  location: "",
                  startDate: "",
                  endDate: "",
                  isCurrent: false,
                  details: [],
                }),
              ),
            )
          }
        />
        {draft.education.length === 0 ? (
          <EmptySection>No education entries added.</EmptySection>
        ) : (
          draft.education.map((entry, index) => (
            <article className="resume-entry-card" key={entry.clientKey}>
              <h4>Education {index + 1}</h4>
              <div className="resume-form-grid">
                {(
                  [
                    ["Institution", "institution", 200],
                    ["Qualification", "qualification", 200],
                    ["Field of study", "fieldOfStudy", 200],
                    ["Location", "location", 200],
                    ["Start date", "startDate", 30],
                    ["End date", "endDate", 30],
                  ] as const
                ).map(([label, field, maximum]) => (
                  <label key={field}>
                    {label}
                    <input
                      {...fieldAttributes(`education.${index}.${field}`)}
                      aria-label={label}
                      disabled={disabled}
                      maxLength={maximum}
                      value={entry[field] ?? ""}
                      onChange={(event) =>
                        mutate((next) => {
                          next.education[index]![field] =
                            event.target.value;
                        })
                      }
                    />
                    {fieldError(`education.${index}.${field}`)}
                  </label>
                ))}
                <label className="resume-checkbox-field">
                  <input
                    disabled={disabled}
                    type="checkbox"
                    checked={entry.isCurrent}
                    onChange={(event) =>
                      mutate((next) => {
                        next.education[index]!.isCurrent =
                          event.target.checked;
                      })
                    }
                  />
                  Currently studying
                </label>
              </div>
              {entry.details.map((detail, detailIndex) => (
                <div className="resume-bullet-row" key={detail.clientKey}>
                  <label>
                    Education detail {detailIndex + 1}
                    <textarea
                      {...fieldAttributes(
                        `education.${index}.details.${detailIndex}.text`,
                      )}
                      aria-label={`Education detail ${detailIndex + 1}`}
                      disabled={disabled}
                      maxLength={2_000}
                      rows={2}
                      value={detail.text}
                      onChange={(event) =>
                        mutate((next) => {
                          next.education[index]!.details[
                            detailIndex
                          ]!.text = event.target.value;
                        })
                      }
                    />
                    {fieldError(
                      `education.${index}.details.${detailIndex}.text`,
                    )}
                  </label>
                  <MoveButtons
                    label={`education ${index + 1} detail ${detailIndex + 1}`}
                    index={detailIndex}
                    count={entry.details.length}
                    disabled={disabled}
                    onMove={(from, to) =>
                      mutate((next) =>
                        move(next.education[index]!.details, from, to),
                      )
                    }
                    onRemove={() =>
                      mutate((next) =>
                        next.education[index]!.details.splice(
                          detailIndex,
                          1,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={disabled || entry.details.length >= 30}
                onClick={() =>
                  mutate((next) =>
                    addBullet(next.education[index]!.details),
                  )
                }
              >
                Add education detail
              </button>
              <MoveButtons
                label={`education ${index + 1}`}
                index={index}
                count={draft.education.length}
                disabled={disabled}
                onMove={(from, to) =>
                  mutate((next) => move(next.education, from, to))
                }
                onRemove={() =>
                  mutate((next) => next.education.splice(index, 1))
                }
              />
            </article>
          ))
        )}
      </section>

      <section
        id="resume-section-skills"
        className="resume-editor-section"
        aria-labelledby="resume-section-skills-heading"
      >
        <SectionHeading
          headingId="resume-section-skills-heading"
          title="Skills"
          description="Group related keywords for scanning."
          addLabel="Add skill group"
          disabled={disabled || draft.skills.length >= 30}
          onAdd={() =>
            mutate((next) =>
              next.skills.push(
                createDraftEntity({ name: "", keywords: [] }),
              ),
            )
          }
        />
        {draft.skills.length === 0 ? (
          <EmptySection>No skill groups added.</EmptySection>
        ) : (
          draft.skills.map((entry, index) => (
            <div className="resume-entry-card" key={entry.clientKey}>
              <div className="resume-form-grid">
                <label>
                  Skill group {index + 1} name
                  <input
                    {...fieldAttributes(`skills.${index}.name`)}
                    aria-label={`Skill group ${index + 1} name`}
                    disabled={disabled}
                    maxLength={120}
                    value={entry.name}
                    onChange={(event) =>
                      mutate((next) => {
                        next.skills[index]!.name = event.target.value;
                      })
                    }
                  />
                  {fieldError(`skills.${index}.name`)}
                </label>
                <label>
                  Keywords, comma separated
                  <input
                    disabled={disabled}
                    value={entry.keywords.join(", ")}
                    onChange={(event) =>
                      mutate((next) => {
                        next.skills[index]!.keywords = splitList(
                          event.target.value,
                        ).slice(0, 100);
                      })
                    }
                  />
                </label>
              </div>
              <MoveButtons
                label={`skill group ${index + 1}`}
                index={index}
                count={draft.skills.length}
                disabled={disabled}
                onMove={(from, to) =>
                  mutate((next) => move(next.skills, from, to))
                }
                onRemove={() =>
                  mutate((next) => next.skills.splice(index, 1))
                }
              />
            </div>
          ))
        )}
      </section>

      <section
        id="resume-section-projects"
        className="resume-editor-section"
        aria-labelledby="resume-section-projects-heading"
      >
        <SectionHeading
          headingId="resume-section-projects-heading"
          title="Projects"
          description="Describe selected work, technologies, links, and evidence."
          addLabel="Add project"
          disabled={disabled || draft.projects.length >= 50}
          onAdd={() =>
            mutate((next) =>
              next.projects.push(
                createDraftEntity({
                  name: "",
                  role: "",
                  description: "",
                  startDate: "",
                  endDate: "",
                  technologies: [],
                  links: [],
                  bullets: [],
                }),
              ),
            )
          }
        />
        {draft.projects.length === 0 ? (
          <EmptySection>No projects added.</EmptySection>
        ) : (
          draft.projects.map((entry, index) => (
            <article className="resume-entry-card" key={entry.clientKey}>
              <h4>Project {index + 1}</h4>
              <div className="resume-form-grid">
                {(
                  [
                    ["Project name", "name", 200],
                    ["Role", "role", 160],
                    ["Start date", "startDate", 30],
                    ["End date", "endDate", 30],
                  ] as const
                ).map(([label, field, maximum]) => (
                  <label key={field}>
                    {label}
                    <input
                      {...fieldAttributes(`projects.${index}.${field}`)}
                      aria-label={label}
                      disabled={disabled}
                      maxLength={maximum}
                      value={entry[field] ?? ""}
                      onChange={(event) =>
                        mutate((next) => {
                          next.projects[index]![field] =
                            event.target.value;
                        })
                      }
                    />
                    {fieldError(`projects.${index}.${field}`)}
                  </label>
                ))}
                <label className="resume-field-wide">
                  Description
                  <textarea
                    disabled={disabled}
                    maxLength={2_000}
                    rows={3}
                    value={entry.description ?? ""}
                    onChange={(event) =>
                      mutate((next) => {
                        next.projects[index]!.description =
                          event.target.value;
                      })
                    }
                  />
                </label>
                <label className="resume-field-wide">
                  Technologies, comma separated
                  <input
                    disabled={disabled}
                    value={entry.technologies.join(", ")}
                    onChange={(event) =>
                      mutate((next) => {
                        next.projects[index]!.technologies = splitList(
                          event.target.value,
                        ).slice(0, 100);
                      })
                    }
                  />
                </label>
              </div>
              {entry.links.map((link, linkIndex) => (
                <div className="resume-bullet-row" key={link.clientKey}>
                  <label>
                    Project link label
                    <input
                      {...fieldAttributes(
                        `projects.${index}.links.${linkIndex}.label`,
                      )}
                      aria-label="Project link label"
                      disabled={disabled}
                      maxLength={80}
                      value={link.label}
                      onChange={(event) =>
                        mutate((next) => {
                          next.projects[index]!.links[linkIndex]!.label =
                            event.target.value;
                        })
                      }
                    />
                    {fieldError(
                      `projects.${index}.links.${linkIndex}.label`,
                    )}
                  </label>
                  <label>
                    Project link URL
                    <input
                      {...fieldAttributes(
                        `projects.${index}.links.${linkIndex}.url`,
                      )}
                      aria-label="Project link URL"
                      disabled={disabled}
                      type="text"
                      inputMode="url"
                      autoCapitalize="none"
                      spellCheck={false}
                      maxLength={2_000}
                      value={link.url}
                      onChange={(event) =>
                        mutate((next) => {
                          next.projects[index]!.links[linkIndex]!.url =
                            event.target.value;
                        })
                      }
                    />
                    {fieldError(
                      `projects.${index}.links.${linkIndex}.url`,
                    )}
                  </label>
                  <MoveButtons
                    label={`project ${index + 1} link ${linkIndex + 1}`}
                    index={linkIndex}
                    count={entry.links.length}
                    disabled={disabled}
                    onMove={(from, to) =>
                      mutate((next) =>
                        move(next.projects[index]!.links, from, to),
                      )
                    }
                    onRemove={() =>
                      mutate((next) =>
                        next.projects[index]!.links.splice(linkIndex, 1),
                      )
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={disabled || entry.links.length >= 20}
                onClick={() =>
                  mutate((next) => addLink(next.projects[index]!.links))
                }
              >
                Add project link
              </button>
              {entry.bullets.map((bullet, bulletIndex) => (
                <div className="resume-bullet-row" key={bullet.clientKey}>
                  <label>
                    Project bullet {bulletIndex + 1}
                    <textarea
                      {...fieldAttributes(
                        `projects.${index}.bullets.${bulletIndex}.text`,
                      )}
                      aria-label={`Project bullet ${bulletIndex + 1}`}
                      disabled={disabled}
                      maxLength={2_000}
                      rows={2}
                      value={bullet.text}
                      onChange={(event) =>
                        mutate((next) => {
                          next.projects[index]!.bullets[
                            bulletIndex
                          ]!.text = event.target.value;
                        })
                      }
                    />
                    {fieldError(
                      `projects.${index}.bullets.${bulletIndex}.text`,
                    )}
                  </label>
                  <MoveButtons
                    label={`project ${index + 1} bullet ${bulletIndex + 1}`}
                    index={bulletIndex}
                    count={entry.bullets.length}
                    disabled={disabled}
                    onMove={(from, to) =>
                      mutate((next) =>
                        move(next.projects[index]!.bullets, from, to),
                      )
                    }
                    onRemove={() =>
                      mutate((next) =>
                        next.projects[index]!.bullets.splice(
                          bulletIndex,
                          1,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={disabled || entry.bullets.length >= 50}
                onClick={() =>
                  mutate((next) =>
                    addBullet(next.projects[index]!.bullets),
                  )
                }
              >
                Add project bullet
              </button>
              <MoveButtons
                label={`project ${index + 1}`}
                index={index}
                count={draft.projects.length}
                disabled={disabled}
                onMove={(from, to) =>
                  mutate((next) => move(next.projects, from, to))
                }
                onRemove={() =>
                  mutate((next) => next.projects.splice(index, 1))
                }
              />
            </article>
          ))
        )}
      </section>

      <section
        id="resume-section-certifications"
        className="resume-editor-section"
        aria-labelledby="resume-section-certifications-heading"
      >
        <SectionHeading
          headingId="resume-section-certifications-heading"
          title="Certifications"
          description="Record verified credentials and optional public URLs."
          addLabel="Add certification"
          disabled={disabled || draft.certifications.length >= 50}
          onAdd={() =>
            mutate((next) =>
              next.certifications.push(
                createDraftEntity({
                  name: "",
                  issuer: "",
                  issuedDate: "",
                  credentialUrl: "",
                }),
              ),
            )
          }
        />
        {draft.certifications.length === 0 ? (
          <EmptySection>No certifications added.</EmptySection>
        ) : (
          draft.certifications.map((entry, index) => (
            <div className="resume-entry-card" key={entry.clientKey}>
              <div className="resume-form-grid">
                {(
                  [
                    ["Certification name", "name", 200],
                    ["Issuer", "issuer", 200],
                    ["Issued date", "issuedDate", 30],
                    ["Credential URL", "credentialUrl", 2_000],
                  ] as const
                ).map(([label, field, maximum]) => (
                  <label key={field}>
                    {label}
                    <input
                      {...fieldAttributes(`certifications.${index}.${field}`)}
                      aria-label={label}
                      disabled={disabled}
                      maxLength={maximum}
                      type="text"
                      {...(field === "credentialUrl"
                        ? {
                            inputMode: "url" as const,
                            autoCapitalize: "none",
                            spellCheck: false,
                          }
                        : {})}
                      value={entry[field] ?? ""}
                      onChange={(event) =>
                        mutate((next) => {
                          next.certifications[index]![field] =
                            event.target.value;
                        })
                      }
                    />
                    {fieldError(`certifications.${index}.${field}`)}
                  </label>
                ))}
              </div>
              <MoveButtons
                label={`certification ${index + 1}`}
                index={index}
                count={draft.certifications.length}
                disabled={disabled}
                onMove={(from, to) =>
                  mutate((next) => move(next.certifications, from, to))
                }
                onRemove={() =>
                  mutate((next) => next.certifications.splice(index, 1))
                }
              />
            </div>
          ))
        )}
      </section>

      <section
        id="resume-section-languages"
        className="resume-editor-section"
        aria-labelledby="resume-section-languages-heading"
      >
        <SectionHeading
          headingId="resume-section-languages-heading"
          title="Languages"
          description="Add languages and optional proficiency wording."
          addLabel="Add language"
          disabled={disabled || draft.languages.length >= 30}
          onAdd={() =>
            mutate((next) =>
              next.languages.push(
                createDraftEntity({ name: "", proficiency: "" }),
              ),
            )
          }
        />
        {draft.languages.length === 0 ? (
          <EmptySection>No languages added.</EmptySection>
        ) : (
          draft.languages.map((entry, index) => (
            <div className="resume-entry-card" key={entry.clientKey}>
              <div className="resume-form-grid">
                <label>
                  Language {index + 1}
                  <input
                    {...fieldAttributes(`languages.${index}.name`)}
                    aria-label={`Language ${index + 1}`}
                    disabled={disabled}
                    maxLength={120}
                    value={entry.name}
                    onChange={(event) =>
                      mutate((next) => {
                        next.languages[index]!.name = event.target.value;
                      })
                    }
                  />
                  {fieldError(`languages.${index}.name`)}
                </label>
                <label>
                  Proficiency
                  <input
                    disabled={disabled}
                    maxLength={80}
                    value={entry.proficiency ?? ""}
                    onChange={(event) =>
                      mutate((next) => {
                        next.languages[index]!.proficiency =
                          event.target.value;
                      })
                    }
                  />
                </label>
              </div>
              <MoveButtons
                label={`language ${index + 1}`}
                index={index}
                count={draft.languages.length}
                disabled={disabled}
                onMove={(from, to) =>
                  mutate((next) => move(next.languages, from, to))
                }
                onRemove={() =>
                  mutate((next) => next.languages.splice(index, 1))
                }
              />
            </div>
          ))
        )}
      </section>

      <section
        id="resume-section-interests"
        className="resume-editor-section"
        aria-labelledby="resume-section-interests-heading"
      >
        <SectionHeading
          headingId="resume-section-interests-heading"
          title="Interests"
          description="Use short, factual interests where they add context."
          addLabel="Add interest"
          disabled={disabled || draft.interests.length >= 50}
          onAdd={() =>
            mutate((next) =>
              next.interests.push(createDraftEntity({ value: "" })),
            )
          }
        />
        {draft.interests.length === 0 ? (
          <EmptySection>No interests added.</EmptySection>
        ) : (
          draft.interests.map((entry, index) => (
            <div className="resume-entry-card" key={entry.clientKey}>
              <label>
                Interest {index + 1}
                <input
                  {...fieldAttributes(`interests.${index}.value`)}
                  aria-label={`Interest ${index + 1}`}
                  disabled={disabled}
                  maxLength={120}
                  value={entry.value}
                  onChange={(event) =>
                    mutate((next) => {
                      next.interests[index]!.value = event.target.value;
                    })
                  }
                />
                {fieldError(`interests.${index}.value`)}
              </label>
              <MoveButtons
                label={`interest ${index + 1}`}
                index={index}
                count={draft.interests.length}
                disabled={disabled}
                onMove={(from, to) =>
                  mutate((next) => move(next.interests, from, to))
                }
                onRemove={() =>
                  mutate((next) => next.interests.splice(index, 1))
                }
              />
            </div>
          ))
        )}
      </section>
    </section>
  );
}
