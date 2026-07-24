import { ResumeWorkspace } from "./features/resumes";
import { InterviewDashboard } from "./features/interviews";
import { LearningDashboard } from "./features/learning";
import { MainDashboard } from "./features/dashboard";

const modules = [
  {
    title: "Resume Studio",
    description: "Build, analyse, improve, version, and export resumes.",
    status: "Foundation active",
  },
  {
    title: "Interview Coach",
    description:
      "Prepare for interviews with guided questions and practice.",
    status: "Foundation active",
  },
  {
    title: "Learning Workspace",
    description:
      "Study documents using summaries, flashcards, quizzes, and chat.",
    status: "Foundation active",
  },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Unified MERN Platform</p>
          <h1>Career &amp; Learning Hub</h1>
          <p className="subtitle">
            One secure workspace for career development and continuous
            learning.
          </p>
        </div>
      </header>

      <main>
        <MainDashboard />
        <section className="module-grid" aria-label="Platform modules">
          {modules.map((module) => (
            <article className="module-card" key={module.title}>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <button type="button" disabled>
                {module.status}
              </button>
            </article>
          ))}
        </section>

        <ResumeWorkspace />
        <InterviewDashboard />
        <LearningDashboard />
      </main>
    </div>
  );
}
