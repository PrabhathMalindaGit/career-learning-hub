import type { ResumeDesign } from "./types";

const maximumTitleLength = 96;
const fallbackCleanupMilliseconds = 4_000;
let printActive = false;

export function createResumePrintTitle(input: {
  resumeTitle: string;
  versionNumber: number;
  pageSize: ResumeDesign["pageSize"];
}): string {
  const suffix = `-v${input.versionNumber}-${input.pageSize.toLowerCase()}`;
  const maximumBaseLength = maximumTitleLength - suffix.length;
  const normalized = input.resumeTitle
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(?:\.pdf)+$/gi, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maximumBaseLength)
    .replace(/-$/g, "");
  return `${normalized || "resume"}${suffix}`;
}

function settlePrintState(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

export async function openResumePrint(input: {
  title: string;
  onPrintStateChange: (active: boolean) => void;
}): Promise<boolean> {
  if (printActive) return false;

  printActive = true;
  const originalTitle = document.title;
  let fallbackId: number | undefined;
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (fallbackId !== undefined) window.clearTimeout(fallbackId);
    window.removeEventListener("afterprint", cleanup);
    document.title = originalTitle;
    input.onPrintStateChange(false);
    printActive = false;
  };

  window.addEventListener("afterprint", cleanup);
  document.title = input.title;
  input.onPrintStateChange(true);
  fallbackId = window.setTimeout(
    cleanup,
    fallbackCleanupMilliseconds,
  );

  try {
    await settlePrintState();
    window.print();
    return true;
  } catch (error) {
    cleanup();
    throw error;
  }
}
