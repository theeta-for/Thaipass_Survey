import type { ReactNode } from "react";

type QuestionCardProps = {
  number?: number;
  title: string;
  instruction?: string;
  error?: string;
  children: ReactNode;
};

export function QuestionCard({ number, title, instruction, error, children }: QuestionCardProps) {
  return (
    <section className={`question-card ${error ? "has-error" : ""}`}>
      <div className="question-heading">
        {number ? <span className="question-number">{number}</span> : null}
        <div>
          <h2>{title}</h2>
          {instruction ? <p>{instruction}</p> : null}
        </div>
      </div>
      {children}
      {error ? <p className="field-error">{error}</p> : null}
    </section>
  );
}
