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
> = { session: createdSession, questions: [] };

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

function Harness({
  initiallyOpen = true,
  onCreated = () => undefined,
}: {
  initiallyOpen?: boolean;
  onCreated?: (sessionId: string) => void;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const returnFocusRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button type="button" ref={returnFocusRef} onClick={() => setOpen(true)}>
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

async function chooseArea(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Career area" }),
    value,
  );
}

async function chooseTechnologyBackend(
  user: ReturnType<typeof userEvent.setup>,
) {
  await chooseArea(user, "technology-it");
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
  await chooseTechnologyBackend(user);
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

  it("starts with no biased career area and keeps the approved experience/mode controls", async () => {
    render(<Harness />);

    const dialog = screen.getByRole("dialog", { name: "Create interview" });
    expect(dialog.hasAttribute("open")).toBe(true);
    const title = screen.getByRole("textbox", { name: "Session title" });
    await waitFor(() => expect(document.activeElement).toBe(title));

    expect(
      screen.getByText(
        "Required: Session title, Career area, Target role, Experience level and Practice mode.",
      ),
    ).not.toBeNull();
    expect(document.body.textContent).not.toContain("(required)");

    const area = screen.getByRole("combobox", { name: "Career area" });
    expect((area as HTMLSelectElement).value).toBe("");
    expect(
      within(area).getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      "Choose a career area",
      "Technology & IT",
      "Business & Management",
      "Finance & Accounting",
      "Marketing & Sales",
      "Human Resources",
      "Healthcare",
      "Engineering",
      "Education & Training",
      "Law & Legal Services",
      "Design & Creative",
      "Operations & Supply Chain",
      "Customer Service & Hospitality",
      "Science & Research",
      "Public Service & Administration",
      "Other / Custom",
    ]);

    expect(
      (screen.getByRole("combobox", { name: "Target role" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "Backend Developer" })).toBeNull();

    const experience = screen.getByRole("combobox", { name: "Experience level" });
    expect((experience as HTMLSelectElement).value).toBe("Mid-level");
    expect(
      within(experience).getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      "Intern / Student",
      "Entry-level",
      "Junior",
      "Mid-level",
      "Senior",
      "Lead / Staff",
      "Manager",
    ]);
    expect(
      within(screen.getByRole("combobox", { name: "Practice mode" }))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Written practice", "Study"]);
  });

  it("changes representative roles and guidance with the selected career area", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await chooseArea(user, "finance-accounting");
    expect(screen.getByRole("button", { name: "Accountant" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Backend Developer" })).toBeNull();
    expect(
      within(screen.getByRole("group", { name: "Focus topics · Optional" }))
        .getByRole("button", { name: "Financial Reporting" }),
    ).not.toBeNull();

    await chooseArea(user, "healthcare");
    expect(screen.getByRole("button", { name: "Nurse" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Accountant" })).toBeNull();
    expect(
      within(screen.getByRole("group", { name: "Skill gaps · Optional" }))
        .getByRole("button", { name: "Clinical Reasoning" }),
    ).not.toBeNull();
  });

  it("uses generic professional guidance for Other / Custom", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await chooseArea(user, "other-custom");

    expect(screen.queryByLabelText("Suggested roles")).toBeNull();
    const focus = screen.getByRole("group", { name: "Focus topics · Optional" });
    expect(within(focus).getByRole("button", { name: "Role Knowledge" })).not.toBeNull();
    expect(within(focus).queryByRole("button", { name: "Software & Systems" })).toBeNull();

    const role = screen.getByRole("combobox", { name: "Target role" });
    await user.type(role, "Marine Surveyor");
    await user.click(screen.getByRole("button", { name: "Use “Marine Surveyor”" }));
    expect(comboboxValue("Target role")).toBe("Marine Surveyor");
  });

  it("suggests a title until the user owns it and preserves owned title across area changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await chooseArea(user, "finance-accounting");
    await user.click(screen.getByRole("button", { name: "Accountant" }));
    expect(textboxValue("Session title")).toBe("Mid-level Accountant Interview");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Experience level" }),
      "Senior",
    );
    expect(textboxValue("Session title")).toBe("Senior Accountant Interview");

    await setManualTitle(user, "My focused interview");
    await chooseArea(user, "healthcare");
    expect(comboboxValue("Target role")).toBe("");
    expect(textboxValue("Session title")).toBe("My focused interview");
  });

  it("clears a system-owned title and target role when career area changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await chooseArea(user, "finance-accounting");
    await user.click(screen.getByRole("button", { name: "Auditor" }));
    expect(textboxValue("Session title")).toBe("Mid-level Auditor Interview");

    await chooseArea(user, "engineering");
    expect(comboboxValue("Target role")).toBe("");
    expect(textboxValue("Session title")).toBe("");
    expect(screen.getByRole("button", { name: "Civil Engineer" })).not.toBeNull();
  });

  it("preserves selected Focus topics and Skill gaps when career area changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await chooseArea(user, "finance-accounting");

    const focus = screen.getByRole("group", { name: "Focus topics · Optional" });
    const gaps = screen.getByRole("group", { name: "Skill gaps · Optional" });
    await user.click(within(focus).getByRole("button", { name: "Financial Reporting" }));
    await user.click(within(gaps).getByRole("button", { name: "Attention to Detail" }));

    await chooseArea(user, "healthcare");
    expect(
      within(focus).getByRole("button", { name: "Financial Reporting" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(
      within(gaps).getByRole("button", { name: "Attention to Detail" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(within(focus).getByRole("button", { name: "Patient Care" })).not.toBeNull();
  });

  it("keeps a custom role inside the selected area's guidance context", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await chooseArea(user, "healthcare");

    const role = screen.getByRole("combobox", { name: "Target role" });
    await user.type(role, "Occupational Therapist");
    await user.click(
      screen.getByRole("button", { name: "Use “Occupational Therapist”" }),
    );
    expect(textboxValue("Session title")).toBe(
      "Mid-level Occupational Therapist Interview",
    );
    expect(
      within(screen.getByRole("group", { name: "Focus topics · Optional" }))
        .getByRole("button", { name: "Patient Care" }),
    ).not.toBeNull();
  });

  it("validates missing Career area, title and target role together", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Create interview" }));

    const summary = screen.getByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(summary));
    expect(within(summary).getByText("Session title")).not.toBeNull();
    expect(within(summary).getByText("Career area")).not.toBeNull();
    expect(within(summary).getByText("Target role")).not.toBeNull();
    expect(interviewApi.createInterviewSession).not.toHaveBeenCalled();
  });

  it("focuses the only invalid title after area and role are valid", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await chooseTechnologyBackend(user);
    await setManualTitle(user, "");
    await user.click(screen.getByRole("button", { name: "Create interview" }));

    const title = screen.getByRole("textbox", { name: "Session title" });
    await waitFor(() => expect(document.activeElement).toBe(title));
    expect(screen.getByText(/1–160 characters/)).not.toBeNull();
  });

  it("Cancel resets the frontend-only area state and returns focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    const openButton = screen.getByRole("button", { name: "Open create dialog" });
    await waitFor(() => expect(document.activeElement).toBe(openButton));
    await user.click(openButton);
    expect(comboboxValue("Career area")).toBe("");
    expect(textboxValue("Session title")).toBe("");
    expect(comboboxValue("Target role")).toBe("");
    expect(comboboxValue("Experience level")).toBe("Mid-level");
  });

  it("a native cancel event models Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole("textbox", { name: "Session title" }), "Temporary");
    dispatchDialogCancel(screen.getByRole("dialog", { name: "Create interview" }));
    const openButton = screen.getByRole("button", { name: "Open create dialog" });
    await waitFor(() => expect(document.activeElement).toBe(openButton));
  });

  it("keeps entered values and safe request ID after an API failure", async () => {
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
    await user.click(screen.getByRole("button", { name: "Create interview" }));

    const error = await screen.findByRole("alert");
    expect(error.textContent).toContain("req-create-dialog-1234");
    expect(comboboxValue("Career area")).toBe("technology-it");
    expect(comboboxValue("Target role")).toBe("Backend Developer");
  });

  it("prevents duplicate submission while the request is pending", async () => {
    const user = userEvent.setup();
    let resolveCreate:
      | ((value: Awaited<ReturnType<typeof interviewApi.createInterviewSession>>) => void)
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
    await user.click(screen.getByRole("button", { name: "Create interview" }));

    const dialog = screen.getByRole("dialog", { name: "Create interview" });
    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
    dispatchDialogCancel(dialog);
    expect(dialog.hasAttribute("open")).toBe(true);
  });

  it("keeps optional topics empty and does not send careerArea to the API", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await chooseTechnologyBackend(user);
    await user.click(screen.getByRole("button", { name: "Create interview" }));

    await waitFor(() => expect(interviewApi.createInterviewSession).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(interviewApi.createInterviewSession).mock.calls[0]?.[0];
    expect(payload).toEqual(
      expect.objectContaining({
        targetRole: "Backend Developer",
        focusTopics: [],
        skillGaps: [],
      }),
    );
    expect(payload).not.toHaveProperty("careerArea");
  });

  it("commits pending custom drafts, trims fields, and calls onCreated once", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<Harness onCreated={onCreated} />);
    await chooseTechnologyBackend(user);
    await setManualTitle(user, "  Platform interview preparation  ");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Experience level" }),
      "Senior",
    );

    const focus = screen.getByRole("group", { name: "Focus topics · Optional" });
    const gaps = screen.getByRole("group", { name: "Skill gaps · Optional" });
    await user.type(within(focus).getByRole("textbox", { name: "Custom Focus topics" }), "API design");
    await user.type(within(gaps).getByRole("textbox", { name: "Custom Skill gaps" }), "Concurrency, Testing strategy");
    await user.click(screen.getByText("Additional context · Optional"));
    await user.type(
      screen.getByRole("textbox", { name: /^Job description/i }),
      "  Build reliable platform services.  ",
    );
    await user.click(screen.getByRole("button", { name: "Create interview" }));

    await waitFor(() => expect(interviewApi.createInterviewSession).toHaveBeenCalledTimes(1));
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
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(sessionId));
  });
});
