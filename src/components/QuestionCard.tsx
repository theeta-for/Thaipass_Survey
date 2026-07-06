import type { ReactNode } from "react";

type QuestionCardProps = {
  number?: number;
  title: string;
  description?: string;
  instruction?: string;
  error?: string;
  children: ReactNode;
};

export function QuestionCard({ number, title, description, instruction, error, children }: QuestionCardProps) {
  return (
    <section className={`question-card ${error ? "has-error" : ""}`}>
      <div className="question-heading">
        {number ? <span className="question-number">{number}</span> : null}
        <div>
          <h2>{title}</h2>
          {instruction ? <p>{instruction}</p> : null}
        </div>
      </div>
      {description ? (
        <div className="concept-statement">
          {description.split("\n\n").map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {children}
      {error ? <p className="field-error">{error}</p> : null}
    </section>
  );
}
