import type {
  DocumentChunk,
  LearningDocument,
} from "./types";

interface DocumentViewerProps {
  document?: LearningDocument;
  chunks: DocumentChunk[];
  onSelectPage?(page: number): void;
}

export function DocumentViewer({
  document,
  chunks,
  onSelectPage,
}: DocumentViewerProps) {
  return (
    <section
      className="learning-panel learning-viewer"
      aria-labelledby="learning-viewer-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Document</p>
          <h3 id="learning-viewer-title">
            {document?.title ?? "No document selected"}
          </h3>
        </div>
        <span className="learning-chip">
          {document?.status ?? "empty"}
        </span>
      </header>

      {!document ? (
        <div className="learning-empty-state">
          Upload or select a learning document.
        </div>
      ) : (
        <>
          <div className="learning-document-summary">
            <strong>
              {document.pageCount} pages · {document.chunkCount} chunks
            </strong>
            <p>
              {document.summary ??
                "The summary appears after background processing."}
            </p>
          </div>

          <div className="learning-chunk-list">
            {chunks.map((chunk) => (
              <article
                className="learning-chunk"
                key={chunk.id}
              >
                <button
                  type="button"
                  onClick={() => onSelectPage?.(chunk.pageStart)}
                >
                  Page {chunk.pageStart}
                </button>
                <p>{chunk.text}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
