import { useState, type FormEvent } from "react";
import type { LearningMessage } from "./types";

interface DocumentChatProps {
  messages: LearningMessage[];
  disabled?: boolean;
  onSend(content: string): void;
}

export function DocumentChat({
  messages,
  disabled = false,
  onSend,
}: DocumentChatProps) {
  const [content, setContent] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = content.trim();
    if (!message) return;

    onSend(message);
    setContent("");
  };

  return (
    <section
      className="learning-panel learning-chat"
      aria-labelledby="learning-chat-title"
    >
      <header className="learning-panel-header">
        <div>
          <p className="learning-kicker">Grounded chat</p>
          <h3 id="learning-chat-title">Ask the document</h3>
        </div>
        <span className="learning-chip">
          Page citations
        </span>
      </header>

      <div className="learning-message-list">
        {messages.length === 0 ? (
          <div className="learning-empty-state">
            Answers will be grounded in retrieved document chunks.
          </div>
        ) : (
          messages.map((message) => (
            <article
              className={`learning-message learning-message-${message.role}`}
              key={message._id}
            >
              <strong>
                {message.role === "user" ? "You" : "Assistant"}
              </strong>
              <p>{message.content}</p>
              {message.sourcePages.length > 0 && (
                <small>
                  Pages {message.sourcePages.join(", ")}
                </small>
              )}
            </article>
          ))
        )}
      </div>

      <form className="learning-chat-form" onSubmit={submit}>
        <textarea
          rows={4}
          maxLength={12_000}
          disabled={disabled}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Ask a question about the selected document."
        />
        <button
          type="submit"
          className="learning-primary-button"
          disabled={disabled || content.trim().length === 0}
        >
          Send question
        </button>
      </form>
    </section>
  );
}
