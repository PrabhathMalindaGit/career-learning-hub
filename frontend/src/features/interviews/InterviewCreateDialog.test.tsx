import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ApiError } from "../../api/apiClient";
import * as interviewApi from "./interviewApi";
import { InterviewCreateDialog } from "./InterviewCreateDialog";

vi.mock("./interviewApi", () => ({
  createInterviewSession: vi.fn(),
}));

const sessionId = "507f1f77bcf86cd799439021";
const timestamp = "2026-08-12T08:00:00.000Z";

const createdSession = {
  id: sessionId,
  title: "Platform interview preparation",
  targetRole: "Backend Developer",
  experienceLevel: "Mid-level",
  focusTopics: ["API design"],
  skillGaps: ["Concurrency"],
  mode: "written-practice" as const,
  status: "active" as const,
  questionCount: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
};

const createdResponse: Awaited<
  ReturnType<typeof interviewApi.createInterviewSession>
> = {
  session: createdSession,
  questions: [],
};

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});

afterAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: originalShowModal,
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: originalClose,
  });
});

interface HarnessProps {
  initiallyOpen?: boolean;
  onCreated?: (sessionId: string) => void;
}

function Harness({
  initiallyOpen = true,
  onCreated = () => undefined,
}: HarnessProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const returnFocusRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        type="button"
        ref={returnFocusRef}
        onClick={() => setOpen(true)}
      >
        Open create dialog
      </button>
      <InterviewCreateDialog
        open={open}
        returnFocusRef={returnFocusRef}
        onRequestClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </>
  );
}

async function chooseBackendRole(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Backend Developer" }));
}

async function setManualTitle(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  const title = screen.getByRole("textbox", { name: "Session title" });
  await user.clear(title);
  if (value) await user.type(title, value);
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await chooseBackendRole(user);
  await setManualTitle(user, "Platform interview preparation");
}

function textboxValue(name: string | RegExp): string {
  return (screen.getByRole("textbox", { name }) as HTMLInputElement).value;
}

function comboboxValue(name: string | RegExp): string {
  return (
    screen.getByRole("combobox", { name }) as HTMLInputElement | HTMLSelectElement
  ).value;
}

function dispatchDialogCancel(dialog: HTMLElement) {
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
}

describe("InterviewCreateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(interviewApi.createInterviewSession).mockResolvedValue(
      createdResponse,
    );
  });

  it("opens accessibly with clean required copy, approved experience levels and modes", async () => {
    render(<Harness />);

    const dialog = screen.getByRole("dialog", { name: "Create interview" });
    expect(dialog.hasAttribute("open")).toBe(true);

    const title = screen.getByRole("textbox", { name: "Session title" });
    await waitFor(() => expect(document.activeElement).toBe(title));

    expect(
      screen.getByText(
        "Required: Session title, Target role, Experience level and Practice mode.",
      ),
    ).not.toBeNull();
    expect(document.body.textContent).not.toContain("(required)");

    const experience = screen.getByRole("combobox", {
      name: "Experience level",
    });
    expect(
      within(experience)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "Intern / Student",
      "Entry-level",
      "Junior",
      "Mid-level",
      "Senior",
      "Lead / Staff",
      "Manager",
    ]);
    expect((experience as HTMLSelectElement).value).toBe("Mid-level");

    const mode = screen.getByRole("combobox", { name: "Practice mode" });
    expect(
      within(mode)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Written practice", "Study"]);

    const additionalContext = screen.getByText("Additional context · Optional");
    const details = additionalContext.closest("details") as
      | HTMLDetailsElement
      | null;
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
  });

  it("suggests a role-and-level title until the user takes ownership", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await chooseBackendRole(user);
    expect(textboxValue("Session title")).toBe(
      "Mid-level Backend Developer Interview",
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Experience level" }),
      "Senior",
    );
    expect(textboxValue("Session title")).toBe(
      "Senior Backend Developer Interview",
    );

    await setManualTitle(user, "My focused interview");
    await user.click(screen.getByRole("button", { name: "Frontend Developer" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Experience level" }),
      "Junior",
    );
    expect(textboxValue("Session title")).toBe("My focused interview");
  });

  it("shows unselected role-aware topics and preserves chosen values across role changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await chooseBackendRole(user);

    const focus = screen.getByRole("group", { name: "Focus topics · Optional" });
    const gaps = screen.getByRole("group", { name: "Skill gaps · Optional" });
    const restApis = within(focus).getByRole("button", { name: "REST APIs" });
    const databaseOptimization = within(gaps).getByRole("button", {
      name: "Database Optimization",
    });
    expect(restApis.getAttribute("aria-pressed")).toBe("false");
    expect(databaseOptimization.getAttribute("aria-pressed")).toBe("false");

    await user.click(restApis);
    await user.click(databaseOptimization);
    await user.click(screen.getByRole("button", { name: "ML / AI Engineer" }));

    expect(
      within(focus).getByRole("button", { name: "REST APIs" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(
      within(focus).getByRole("button", { name: "Machine Learning" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
    expect(
      within(gaps)
        .getByRole("button", { name: "Database Optimization" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(gaps).getByRole("button", { name: "Model Evaluation" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
  });

  it("uses local family matching for an explicitly adopted custom role", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const role = screen.getByRole("combobox", { name: "Target role" });
    await user.type(role, "LLM Engineer");
    await user.click(screen.getByRole("button", { name: "Use “LLM Engineer”" }));

    expect(comboboxValue("Target role")).toBe("LLM Engineer");
    expect(textboxValue("Session title")).toBe("Mid-level LLM Engineer Interview");
    expect(
      within(
        screen.getByRole("group", { name: "Focus topics · Optional" }),
      ).getByRole("button", { name: "LLMs" }),
    ).not.toBeNull();
  });

  it("Cancel resets the form, closes the dialog, and returns focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await fillRequiredFields(user);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Experience level" }),
      "Senior",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Practice mode" }),
      "study",
    );
    const focus = screen.getByRole("group", { name: "Focus topics · Optional" });
    await user.click(within(focus).getByRole("button", { name: "REST APIs" }));

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    const openButton = screen.getByRole("button", {
      name: "Open create dialog",
    });
    await waitFor(() => expect(document.activeElement).toBe(openButton));
    expect(
      screen.queryByRole("dialog", { name: "Create interview" }),
    ).toBeNull();

    await user.click(openButton);
    await screen.findByRole("dialog", { name: "Create interview" });
    expect(textboxValue("Session title")).toBe("");
    expect(comboboxValue("Target role")).toBe("");
    expect(comboboxValue("Experience level")).toBe("Mid-level");
    expect(comboboxValue("Practice mode")).toBe("written-practice");
    expect(
      screen.getByRole("button", { name: "Backend Developer" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
    expect(screen.queryByRole("button", { name: "REST APIs" })).toBeNull();
  });

  it("a native cancel event models Escape: it resets, closes, and restores focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(
      screen.getByRole("textbox", { name: "Session title" }),
      "Temporary title",
    );
    const dialog = screen.getByRole("dialog", { name: "Create interview" });
    dispatchDialogCancel(dialog);

    const openButton = screen.getByRole("button", {
      name: "Open create dialog",
    });
    await waitFor(() => expect(document.activeElement).toBe(openButton));
    expect(
      screen.queryByRole("dialog", { name: "Create interview" }),
    ).toBeNull();

    await user.click(openButton);
    expect(textboxValue("Session title")).toBe("");
  });

  it("focuses the only invalid field and does not call the API", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await chooseBackendRole(user);
    await setManualTitle(user, "");
    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );

    const title = screen.getByRole("textbox", { name: "Session title" });
    await waitFor(() => expect(document.activeElement).toBe(title));
    expect(screen.getByText(/1–160 characters/)).not.toBeNull();
    expect(interviewApi.createInterviewSession).not.toHaveBeenCalled();
  });

  it("focuses an accessible validation summary when title and role are missing", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );

    const summary = screen.getByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(summary));
    expect(summary.textContent).toMatch(/review the highlighted fields/i);
    expect(within(summary).getByText("Session title")).not.toBeNull();
    expect(within(summary).getByText("Target role")).not.toBeNull();
    expect(within(summary).queryByText("Experience level")).toBeNull();
    expect(interviewApi.createInterviewSession).not.toHaveBeenCalled();
  });

  it("keeps entered values and shows a safe request ID after an API failure", async () => {
    const user = userEvent.setup();
    vi.mocked(interviewApi.createInterviewSession).mockRejectedValueOnce(
      new ApiError(
        503,
        "INTERVIEW_CREATE_FAILED",
        "The interview session could not be created.",
        "req-create-dialog-1234",
      ),
    );
    render(<Harness />);

    await fillRequiredFields(user);
    const focus = screen.getByRole("group", { name: "Focus topics · Optional" });
    await user.type(
      within(focus).getByRole("textbox", { name: "Custom Focus topics" }),
      "Reliability{Enter}",
    );
    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );

    const error = await screen.findByRole("alert");
    expect(error.textContent).toContain(
      "The interview session could not be created.",
    );
    expect(error.textContent).toContain("req-create-dialog-1234");
    expect(textboxValue("Session title")).toBe(
      "Platform interview preparation",
    );
    expect(comboboxValue("Target role")).toBe("Backend Developer");
    expect(
      within(focus).getByRole("button", { name: "Reliability" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
  });

  it("prevents duplicate submission while the create request is pending", async () => {
    const user = userEvent.setup();
    let resolveCreate:
      | ((
          value: Awaited<
            ReturnType<typeof interviewApi.createInterviewSession>
          >,
        ) => void)
      | undefined;
    vi.mocked(interviewApi.createInterviewSession).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    render(<Harness />);

    await fillRequiredFields(user);
    const submit = screen.getByRole("button", { name: "Create interview" });
    await user.click(submit);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(submit.closest("form") as HTMLFormElement);

    expect(interviewApi.createInterviewSession).toHaveBeenCalledTimes(1);
    resolveCreate?.(createdResponse);
  });

  it("does not close from Cancel or Escape while submission is pending", async () => {
    const user = userEvent.setup();
    vi.mocked(interviewApi.createInterviewSession).mockReturnValueOnce(
      new Promise(() => undefined),
    );
    render(<Harness />);

    await fillRequiredFields(user);
    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Create interview" });
    const cancel = screen.getByRole("button", { name: "Cancel" });
    expect((cancel as HTMLButtonElement).disabled).toBe(true);
    dispatchDialogCancel(dialog);

    expect(dialog.hasAttribute("open")).toBe(true);
  });

  it("keeps optional topics empty when the user intentionally selects none", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await chooseBackendRole(user);
    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );

    await waitFor(() => {
      expect(interviewApi.createInterviewSession).toHaveBeenCalledTimes(1);
    });
    expect(interviewApi.createInterviewSession).toHaveBeenCalledWith(
      expect.objectContaining({ focusTopics: [], skillGaps: [] }),
      expect.any(AbortSignal),
    );
  });

  it("commits pending custom drafts, trims canonical fields, and calls onCreated once", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<Harness onCreated={onCreated} />);

    await chooseBackendRole(user);
    await setManualTitle(user, "  Platform interview preparation  ");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Experience level" }),
      "Senior",
    );

    const focus = screen.getByRole("group", { name: "Focus topics · Optional" });
    const gaps = screen.getByRole("group", { name: "Skill gaps · Optional" });
    await user.type(
      within(focus).getByRole("textbox", { name: "Custom Focus topics" }),
      "API design",
    );
    await user.type(
      within(gaps).getByRole("textbox", { name: "Custom Skill gaps" }),
      "Concurrency, Testing strategy",
    );

    await user.click(screen.getByText("Additional context · Optional"));
    await user.type(
      screen.getByRole("textbox", { name: /^Job description/i }),
      "  Build reliable platform services.  ",
    );

    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );

    await waitFor(() => {
      expect(interviewApi.createInterviewSession).toHaveBeenCalledTimes(1);
    });
    expect(interviewApi.createInterviewSession).toHaveBeenCalledWith(
      {
        title: "Platform interview preparation",
        targetRole: "Backend Developer",
        experienceLevel: "Senior",
        focusTopics: ["API design"],
        skillGaps: ["Concurrency", "Testing strategy"],
        jobDescription: "Build reliable platform services.",
        mode: "written-practice",
      },
      expect.any(AbortSignal),
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(onCreated).toHaveBeenCalledWith(sessionId);
  });
});
