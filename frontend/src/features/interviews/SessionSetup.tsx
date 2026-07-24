import { useState, type FormEvent } from "react";
import type {
  CreateInterviewSessionInput,
  InterviewMode,
} from "./types";

interface SessionSetupProps {
  onCreate(input: CreateInterviewSessionInput): void;
  busy?: boolean;
}

const parseCommaSeparated = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export function SessionSetup({
  onCreate,
  busy = false,
}: SessionSetupProps) {
  const [title, setTitle] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] =
    useState("Junior");
  const [mode, setMode] =
    useState<InterviewMode>("written-practice");
  const [focusTopics, setFocusTopics] = useState("");
  const [skillGaps, setSkillGaps] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();

    onCreate({
      title,
      targetRole,
      experienceLevel,
      mode,
      focusTopics: parseCommaSeparated(focusTopics),
      skillGaps: parseCommaSeparated(skillGaps),
      jobDescription: jobDescription || undefined,
      manualQuestions: [],
    });
  };

  return (
    <section
      className="interview-panel"
      aria-labelledby="interview-setup-title"
    >
      <header className="interview-panel-header">
        <div>
          <p className="interview-kicker">New session</p>
          <h3 id="interview-setup-title">Session setup</h3>
        </div>
        <span className="interview-chip">Manual or AI</span>
      </header>

      <form className="interview-form" onSubmit={submit}>
        <label>
          Session title
          <input
            required
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <label>
          Target role
          <input
            required
            maxLength={200}
            value={targetRole}
            onChange={(event) =>
              setTargetRole(event.target.value)
            }
          />
        </label>

        <div className="interview-form-row">
          <label>
            Experience level
            <input
              required
              maxLength={100}
              value={experienceLevel}
              onChange={(event) =>
                setExperienceLevel(event.target.value)
              }
            />
          </label>

          <label>
            Practice mode
            <select
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as InterviewMode)
              }
            >
              <option value="study">Study</option>
              <option value="written-practice">
                Written practice
              </option>
              <option value="mock-interview">
                Mock interview
              </option>
            </select>
          </label>
        </div>

        <label>
          Focus topics
          <input
            placeholder="React, system design, communication"
            value={focusTopics}
            onChange={(event) =>
              setFocusTopics(event.target.value)
            }
          />
        </label>

        <label>
          Identified skill gaps
          <input
            placeholder="Testing, accessibility, databases"
            value={skillGaps}
            onChange={(event) =>
              setSkillGaps(event.target.value)
            }
          />
        </label>

        <label>
          Job description
          <textarea
            rows={6}
            maxLength={30_000}
            value={jobDescription}
            onChange={(event) =>
              setJobDescription(event.target.value)
            }
          />
        </label>

        <button
          className="interview-primary-button"
          type="submit"
          disabled={
            busy ||
            title.trim().length === 0 ||
            targetRole.trim().length < 2
          }
        >
          Create interview session
        </button>
      </form>
    </section>
  );
}
