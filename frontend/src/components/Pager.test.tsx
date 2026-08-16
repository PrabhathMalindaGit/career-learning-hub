import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pager } from "./Pager";

describe("Pager", () => {
  it("renders a labelled navigation landmark and caller-owned page text", () => {
    render(
      <Pager
        label="Synthetic result pages"
        currentPage="Result page 2 of 4"
        previousLabel="Earlier results"
        nextLabel="Later results"
        previousDisabled={false}
        nextDisabled={false}
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );

    expect(
      screen.getByRole("navigation", {
        name: "Synthetic result pages",
      }),
    ).not.toBeNull();
    expect(screen.getByText("Result page 2 of 4")).not.toBeNull();
  });

  it("preserves caller-owned labels and actions", async () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(
      <Pager
        label="Synthetic result pages"
        currentPage="Result page 2"
        previousLabel="Earlier results"
        nextLabel="Later results"
        previousDisabled={false}
        nextDisabled={false}
        onPrevious={onPrevious}
        onNext={onNext}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Earlier results" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Later results" }),
    );

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("uses native disabled buttons supplied by the caller", () => {
    render(
      <Pager
        label="Synthetic result pages"
        currentPage="Result page 1"
        previousLabel="Earlier results"
        nextLabel="Later results"
        previousDisabled
        nextDisabled
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );

    expect(
      (
        screen.getByRole("button", {
          name: "Earlier results",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Later results",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("preserves caller-owned busy state without fetching or routing", () => {
    render(
      <Pager
        label="Synthetic result pages"
        currentPage="Result page 1"
        previousLabel="Earlier results"
        nextLabel="Later results"
        previousDisabled
        nextDisabled
        busy
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );

    expect(
      screen
        .getByRole("navigation", {
          name: "Synthetic result pages",
        })
        .getAttribute("aria-busy"),
    ).toBe("true");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("does not override caller-owned paging availability while busy", () => {
    render(
      <Pager
        label="Synthetic result pages"
        currentPage="Result page 2"
        previousLabel="Earlier results"
        nextLabel="Later results"
        previousDisabled={false}
        nextDisabled={false}
        busy
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    );

    expect(
      (screen.getByRole("button", { name: "Earlier results" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    expect(
      (screen.getByRole("button", { name: "Later results" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
});
