import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../api/apiClient";
import { useAuth } from "../auth/AuthProvider";
import { FlashcardStudy } from "./FlashcardStudy";
import {
  fetchFlashcardSet,
  fetchLearningDocument,
  listLearningFlashcards,
} from "./learningApi";
import type {
  Flashcard,
  FlashcardSet,
  LearningDocument,
} from "./types";
import "./learningWorkspace.css";

type SafeError = {
  message: string;
  requestId?: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "document-unavailable"; document: LearningDocument }
  | {
      status: "set-unavailable";
      document: LearningDocument;
      set: FlashcardSet;
    }
  | {
      status: "ready";
      document: LearningDocument;
      set: FlashcardSet;
      cards: Flashcard[];
    }
  | {
      status: "not-found" | "malformed" | "unavailable";
      error: SafeError;
    };

function safeError(error: unknown, fallback: string): SafeError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      ...(error.requestId === undefined
        ? {}
        : { requestId: error.requestId }),
    };
  }
  return { message: fallback };
}

function RequestId({ value }: { value?: string }) {
  return value ? (
    <p className="request-id">Request ID: {value}</p>
  ) : null;
}

function documentUnavailableMessage(
  document: LearningDocument,
): string {
  if (
    document.status === "uploaded" ||
    document.status === "processing"
  ) {
    return "Document processing must finish before flashcards can be studied.";
  }
  if (document.status === "failed") {
    return "This document could not be processed and cannot provide grounded flashcards.";
  }
  return "This document is unavailable while deletion completes.";
}

export function LearningFlashcardWorkspace() {
  const { documentId = "", setId = "" } = useParams<{
    documentId: string;
    setId: string;
  }>();
  const { user } = useAuth();
  const accountId = user?.id ?? "";
  const identity = `${accountId}:${documentId}:${setId}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const sequence = useRef(0);
  const [loadState, setLoadState] =
    useState<LoadState>({ status: "loading" });
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++sequence.current;
    setLoadState({ status: "loading" });

    void (async () => {
      try {
        const documentResult = await fetchLearningDocument(
          documentId,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          current !== sequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        if (documentResult.document.status !== "ready") {
          setLoadState({
            status: "document-unavailable",
            document: documentResult.document,
          });
          return;
        }

        const setResult = await fetchFlashcardSet(
          documentId,
          setId,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          current !== sequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        if (setResult.set.status !== "ready") {
          setLoadState({
            status: "set-unavailable",
            document: documentResult.document,
            set: setResult.set,
          });
          return;
        }

        const cardResult = await listLearningFlashcards(
          setId,
          documentResult.document.pageCount,
          { page: 1, limit: 100 },
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          current !== sequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        if (
          cardResult.pagination.page !== 1 ||
          cardResult.pagination.pages > 1 ||
          cardResult.pagination.total !== setResult.set.cardCount ||
          cardResult.cards.length !== setResult.set.cardCount ||
          cardResult.cards.some(
            (card, index) => card.cardIndex !== index,
          )
        ) {
          throw new ApiError(
            502,
            "INVALID_LEARNING_RESPONSE",
            "The server returned an invalid learning response.",
          );
        }
        setLoadState({
          status: "ready",
          document: documentResult.document,
          set: setResult.set,
          cards: cardResult.cards,
        });
      } catch (error) {
        if (
          controller.signal.aborted ||
          current !== sequence.current ||
          identityRef.current !== identity
        ) {
          return;
        }
        const safe = safeError(
          error,
          "The flashcard study workspace is currently unavailable.",
        );
        if (error instanceof ApiError && error.status === 404) {
          setLoadState({ status: "not-found", error: safe });
        } else if (
          error instanceof ApiError &&
          error.code === "INVALID_LEARNING_RESPONSE"
        ) {
          setLoadState({ status: "malformed", error: safe });
        } else {
          setLoadState({ status: "unavailable", error: safe });
        }
      }
    })();

    return () => {
      controller.abort();
      sequence.current += 1;
    };
  }, [accountId, documentId, identity, retryVersion, setId]);

  if (loadState.status === "loading") {
    return (
      <section className="workspace-section learning-workspace">
        <div className="learning-state" role="status">
          Loading flashcard study…
        </div>
      </section>
    );
  }

  if (
    loadState.status === "not-found" ||
    loadState.status === "malformed" ||
    loadState.status === "unavailable"
  ) {
    const title =
      loadState.status === "not-found"
        ? "Flashcard set not found"
        : loadState.status === "malformed"
          ? "Flashcard response unavailable"
          : "Flashcard study unavailable";
    return (
      <section className="workspace-section learning-workspace">
        <p className="eyebrow">Flashcard study</p>
        <h1>{title}</h1>
        <p className="section-intro">{loadState.error.message}</p>
        <RequestId value={loadState.error.requestId} />
        {loadState.status !== "not-found" ? (
          <button
            type="button"
            className="learning-secondary-button"
            onClick={() => setRetryVersion((current) => current + 1)}
          >
            Try flashcard study again
          </button>
        ) : null}
        <Link className="learning-back-link" to="/learning">
          Return to document library
        </Link>
      </section>
    );
  }

  if (loadState.status === "document-unavailable") {
    return (
      <section className="workspace-section learning-workspace">
        <Link
          className="learning-back-link"
          to={`/learning/documents/${documentId}`}
        >
          ← Document workspace
        </Link>
        <p className="eyebrow">Flashcard study</p>
        <h1>Flashcards unavailable</h1>
        <div className="learning-state learning-state--compact">
          <p>{documentUnavailableMessage(loadState.document)}</p>
        </div>
      </section>
    );
  }

  if (loadState.status === "set-unavailable") {
    const failed = loadState.set.status === "failed";
    return (
      <section className="workspace-section learning-workspace">
        <Link
          className="learning-back-link"
          to={`/learning/documents/${documentId}`}
        >
          ← {loadState.document.title}
        </Link>
        <p className="eyebrow">Flashcard study</p>
        <h1>{loadState.set.title}</h1>
        <div
          className={`learning-state learning-state--compact${
            failed ? " learning-state--error" : ""
          }`}
          {...(failed ? { role: "alert" as const } : {})}
        >
          <p>
            {failed
              ? loadState.set.generationError?.message ??
                "Flashcard generation failed."
              : "This flashcard set is still generating."}
          </p>
        </div>
      </section>
    );
  }

  if (loadState.status !== "ready") return null;

  return (
    <section className="workspace-section learning-workspace learning-flashcard-workspace">
      <Link
        className="learning-back-link"
        to={`/learning/documents/${documentId}`}
      >
        ← {loadState.document.title}
      </Link>
      <header className="learning-workspace-header">
        <div>
          <p className="eyebrow">Flashcard study</p>
          <h1>{loadState.set.title}</h1>
          <p className="section-intro">
            <span>{loadState.document.title}</span>
            {" · "}
            {loadState.set.cardCount === 1
              ? "1 canonical card"
              : `${loadState.set.cardCount} canonical cards`}
          </p>
        </div>
        <span className="learning-status learning-status--ready">
          Ready
        </span>
      </header>
      <FlashcardStudy
        key={identity}
        cards={loadState.cards}
        documentId={documentId}
        setId={setId}
      />
    </section>
  );
}
