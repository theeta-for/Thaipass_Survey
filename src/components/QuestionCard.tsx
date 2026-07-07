import type { ReactNode } from "react";

type QuestionCardProps = {
  number?: number;
  title: string;
  description?: string;
  instruction?: string;
  error?: string;
  showConceptMockup?: boolean;
  children: ReactNode;
};

function ConceptMockup() {
  return (
    <div className="concept-mockup" aria-label="Early ThaiPass concept mockup">
      <div className="mockup-phone">
        <div className="mockup-top">
          <span>ThaiPass</span>
          <strong>Trip ready</strong>
        </div>
        <div className="mockup-card is-blue">
          <span>Before arrival</span>
          <strong>3 checklist items left</strong>
        </div>
        <div className="mockup-card">
          <span>Documents</span>
          <strong>Passport info, hotel, insurance</strong>
        </div>
        <div className="mockup-card">
          <span>Support</span>
          <strong>Emergency info and local help</strong>
        </div>
      </div>
      <p>
        This is an early concept mockup. Please answer based on the app idea, not the visual design.
      </p>
    </div>
  );
}

function renderDescription(description: string) {
  return description.split("\n\n").map((paragraph) => {
    const lines = paragraph.split("\n");
    const listItems = lines.filter((line) => line.startsWith("- ")).map((line) => line.slice(2));

    if (listItems.length === lines.length) {
      return (
        <ul key={paragraph}>
          {listItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    }

    return <p key={paragraph}>{paragraph}</p>;
  });
}

export function QuestionCard({
  number,
  title,
  description,
  instruction,
  error,
  showConceptMockup,
  children,
}: QuestionCardProps) {
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
          {renderDescription(description)}
        </div>
      ) : null}
      {showConceptMockup ? <ConceptMockup /> : null}
      {children}
      {error ? <p className="field-error">{error}</p> : null}
    </section>
  );
}
