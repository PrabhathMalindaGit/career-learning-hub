import { DocumentChunkModel } from "./documentChunk.model.js";

export function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchTerms(query: string): string[] {
  const ignored = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
  ]);

  return [
    ...new Set(
      query
        .normalize("NFKC")
        .toLocaleLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .map((term) => term.trim())
        .filter(
          (term) =>
            term.length >= 2 &&
            term.length <= 64 &&
            !ignored.has(term),
        ),
    ),
  ].slice(0, 12);
}

export async function retrieveRelevantChunks(input: {
  userId: string;
  documentId: string;
  query: string;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(input.limit ?? 8, 20));
  const terms = searchTerms(input.query);

  if (terms.length === 0) {
    return DocumentChunkModel.find({
      userId: input.userId,
      documentId: input.documentId,
    })
      .sort({ chunkIndex: 1 })
      .limit(limit)
      .lean();
  }

  const expressions = terms.map(
    (term) =>
      new RegExp(escapeRegularExpression(term), "i"),
  );

  const candidates = await DocumentChunkModel.find({
    userId: input.userId,
    documentId: input.documentId,
    $or: expressions.map((expression) => ({
      text: expression,
    })),
  })
    .sort({ chunkIndex: 1 })
    .limit(100)
    .lean();

  const ranked = candidates
    .map((chunk) => {
      const text = chunk.text.toLocaleLowerCase();
      const score = terms.reduce((total, term) => {
        const expression = new RegExp(
          escapeRegularExpression(term),
          "giu",
        );
        return total + (text.match(expression)?.length ?? 0);
      }, 0);

      return { chunk, score };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.chunk.chunkIndex - right.chunk.chunkIndex,
    )
    .slice(0, limit)
    .map(({ chunk }) => chunk);

  if (ranked.length > 0) return ranked;

  return DocumentChunkModel.find({
    userId: input.userId,
    documentId: input.documentId,
  })
    .sort({ chunkIndex: 1 })
    .limit(limit)
    .lean();
}
