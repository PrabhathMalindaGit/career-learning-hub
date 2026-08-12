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
  targetRole: "Backend Engineer",
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

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: "Session title" }),
    "Platform interview preparation",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Target role" }),
    "Backend Engineer",
  );
}

function inputValue(name: string): string {
  return (
    screen.getByRole("textbox", { name }) as
      | HTMLInputElement
      | HTMLTextAreaElement
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

  it("opens as a modal, focuses Session title, exposes only approved modes, and keeps optional context collapsed", async () => {
    render(<Harness />);

    const dialog = screen.getByRole("dialog", { name: "Create interview" });
    expect(dialog.hasAttribute("open")).toBe(true);

    const title = screen.getByRole("textbox", { name: "Session title" });
    await waitFor(() => expect(document.activeElement).toBe(title));

    const mode = screen.getByRole("combobox", { name: "Practice mode" });
    expect(
      within(mode)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Written practice", "Study"]);
    expect(
      screen.queryByRole("option", { name: /mock interview/i }),
    ).toBeNull();

    const additionalContext = screen.getByText(
      "Additional context (optional)",
    );
    const details = additionalContext.closest("details") as
      | HTMLDetailsElement
      | null;
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
  });

  it("Cancel resets the form, closes the dialog, and returns focus to the invoking control", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await fillRequiredFields(user);
    await user.clear(
      screen.getByRole("textbox", { name: "Experience level" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Experience level" }),
      "Senior",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Practice mode" }),
      "study",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Focus topics" }),
      "API design",
    );
    await user.keyboard("{Enter}");

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
    expect(inputValue("Session title")).toBe("");
    expect(inputValue("Target role")).toBe("");
    expect(inputValue("Experience level")).toBe("Mid-level");
    expect(
      (screen.getByRole("combobox", {
        name: "Practice mode",
      }) as HTMLSelectElement).value,
    ).toBe("written-practice");
    expect(
      screen.queryByRole("button", { name: "Remove API design" }),
    ).toBeNull();
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
    expect(inputValue("Session title")).toBe("");
  });

  it("focuses the only invalid field and does not call the API", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(
      screen.getByRole("textbox", { name: "Target role" }),
      "Backend Engineer",
    );
    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );

    const title = screen.getByRole("textbox", { name: "Session title" });
    await waitFor(() => expect(document.activeElement).toBe(title));
    expect(screen.getByText(/1–160 characters/)).not.toBeNull();
    expect(interviewApi.createInterviewSession).not.toHaveBeenCalled();
  });

  it("focuses an accessible validation summary when several fields are invalid", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.clear(
      screen.getByRole("textbox", { name: "Experience level" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );

    const summary = screen.getByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(summary));
    expect(summary.textContent).toMatch(/review the highlighted fields/i);
    expect(within(summary).getByText("Session title")).not.toBeNull();
    expect(within(summary).getByText("Target role")).not.toBeNull();
    expect(within(summary).getByText("Experience level")).not.toBeNull();
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
    await user.type(
      screen.getByRole("textbox", { name: "Focus topics" }),
      "Reliability",
    );
    await user.keyboard("{Enter}");
    await user.click(
      screen.getByRole("button", { name: "Create interview" }),
    );

    const error = await screen.findByRole("alert");
    expect(error.textContent).toContain(
      "The interview session could not be created.",
    );
    expect(error.textContent).toContain("req-create-dialog-1234");
    expect(inputValue("Session title")).toBe(
      "Platform interview preparation",
    );
    expect(inputValue("Target role")).toBe("Backend Engineer");
    expect(
      screen.getByRole("button", { name: "Remove Reliability" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("dialog", { name: "Create interview" }),
    ).not.toBeNull();
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

  it("commits pending tag drafts, trims canonical fields, and calls onCreated exactly once", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<Harness onCreated={onCreated} />);

    await user.type(
      screen.getByRole("textbox", { name: "Session title" }),
      "  Platform interview preparation  ",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Target role" }),
      "  Backend Engineer  ",
    );
    await user.clear(
      screen.getByRole("textbox", { name: "Experience level" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Experience level" }),
      "  Senior  ",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Focus topics" }),
      "API design",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Skill gaps" }),
      "Concurrency, Testing strategy",
    );

    await user.click(screen.getByText("Additional context (optional)"));
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
        targetRole: "Backend Engineer",
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
