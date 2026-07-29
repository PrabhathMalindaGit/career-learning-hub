export type ResumeDiffSegmentType = "unchanged" | "removed" | "added";

export interface ResumeDiffSegment {
  type: ResumeDiffSegmentType;
  text: string;
}

export interface ResumeTextDiff {
  original: ResumeDiffSegment[];
  suggested: ResumeDiffSegment[];
}

type EditToken = {
  type: ResumeDiffSegmentType;
  value: string;
};

const TOKEN_PATTERN =
  /[\p{L}\p{N}]+(?:[’'\-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]+/gu;
const CLOSING_PUNCTUATION = /^[,.;:!?%…)\]}>’']+$/u;
const OPENING_PUNCTUATION = /^[(\[{<“‘]+$/u;

function tokenize(value: string): string[] {
  return value.match(TOKEN_PATTERN) ?? [];
}

function tokenText(value: string, previous: string | undefined): string {
  if (
    previous === undefined ||
    CLOSING_PUNCTUATION.test(value) ||
    OPENING_PUNCTUATION.test(previous)
  ) {
    return value;
  }

  return ` ${value}`;
}

function buildSegments(
  edits: readonly EditToken[],
  side: "original" | "suggested",
): ResumeDiffSegment[] {
  const segments: ResumeDiffSegment[] = [];
  let previousToken: string | undefined;

  for (const edit of edits) {
    const included =
      edit.type === "unchanged" ||
      (side === "original" && edit.type === "removed") ||
      (side === "suggested" && edit.type === "added");

    if (!included) {
      continue;
    }

    const text = tokenText(edit.value, previousToken);
    const previousSegment = segments.at(-1);
    if (previousSegment?.type === edit.type) {
      previousSegment.text += text;
    } else {
      segments.push({ type: edit.type, text });
    }
    previousToken = edit.value;
  }

  return segments;
}

export function diffResumeText(
  originalText: string,
  suggestedText: string,
): ResumeTextDiff {
  const originalTokens = tokenize(originalText);
  const suggestedTokens = tokenize(suggestedText);
  const commonLengths = Array.from(
    { length: originalTokens.length + 1 },
    () => new Uint16Array(suggestedTokens.length + 1),
  );

  for (let originalIndex = originalTokens.length - 1; originalIndex >= 0; originalIndex -= 1) {
    for (
      let suggestedIndex = suggestedTokens.length - 1;
      suggestedIndex >= 0;
      suggestedIndex -= 1
    ) {
      commonLengths[originalIndex][suggestedIndex] =
        originalTokens[originalIndex] === suggestedTokens[suggestedIndex]
          ? commonLengths[originalIndex + 1][suggestedIndex + 1] + 1
          : Math.max(
              commonLengths[originalIndex + 1][suggestedIndex],
              commonLengths[originalIndex][suggestedIndex + 1],
            );
    }
  }

  const edits: EditToken[] = [];
  let originalIndex = 0;
  let suggestedIndex = 0;

  while (
    originalIndex < originalTokens.length ||
    suggestedIndex < suggestedTokens.length
  ) {
    if (
      originalIndex < originalTokens.length &&
      suggestedIndex < suggestedTokens.length &&
      originalTokens[originalIndex] === suggestedTokens[suggestedIndex]
    ) {
      edits.push({
        type: "unchanged",
        value: originalTokens[originalIndex],
      });
      originalIndex += 1;
      suggestedIndex += 1;
    } else if (
      originalIndex < originalTokens.length &&
      (suggestedIndex >= suggestedTokens.length ||
        commonLengths[originalIndex + 1][suggestedIndex] >=
          commonLengths[originalIndex][suggestedIndex + 1])
    ) {
      edits.push({
        type: "removed",
        value: originalTokens[originalIndex],
      });
      originalIndex += 1;
    } else {
      edits.push({
        type: "added",
        value: suggestedTokens[suggestedIndex],
      });
      suggestedIndex += 1;
    }
  }

  return {
    original: buildSegments(edits, "original"),
    suggested: buildSegments(edits, "suggested"),
  };
}
