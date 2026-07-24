import type { ResumeContent } from "./types";

interface ResumeEditorProps {
  content: ResumeContent;
  onChange(content: ResumeContent): void;
  disabled?: boolean;
}

export function ResumeEditor({
  content,
  onChange,
  disabled = false,
}: ResumeEditorProps) {
  const updateBasics = (
    field: keyof ResumeContent["basics"],
    value: string,
  ) => {
    onChange({
      ...content,
      basics: {
        ...content.basics,
        [field]: value,
      },
    });
  };

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

      <div className="resume-form-grid">
        <label>
          Full name
          <input
            disabled={disabled}
            value={content.basics.fullName}
            onChange={(event) =>
              updateBasics("fullName", event.target.value)
            }
          />
        </label>

        <label>
          Headline
          <input
            disabled={disabled}
            value={content.basics.headline ?? ""}
            onChange={(event) =>
              updateBasics("headline", event.target.value)
            }
          />
        </label>

        <label>
          Email
          <input
            disabled={disabled}
            type="email"
            value={content.basics.email ?? ""}
            onChange={(event) =>
              updateBasics("email", event.target.value)
            }
          />
        </label>

        <label className="resume-field-wide">
          Professional summary
          <textarea
            disabled={disabled}
            rows={6}
            value={content.basics.summary ?? ""}
            onChange={(event) =>
              updateBasics("summary", event.target.value)
            }
          />
        </label>
      </div>

      <div className="resume-placeholder-section">
        <h3>Experience editor placeholder</h3>
        <p>
          Stable entry and bullet IDs are retained by the backend. Migrate
          the prior Resume Builder repeatable-field UI into this section.
        </p>
        <span>{content.experience.length} experience entries</span>
      </div>
    </section>
  );
}
