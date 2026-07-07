import type { ReactNode } from "react";

type QuestionCardProps = {
  number?: number;
  sectionTitle?: string;
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
      <img src="/thaipass-concept-mockup.png" alt="ThaiPass early concept mockup showing trip ready, before arrival, documents, and support cards" />
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
  sectionTitle,
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
          {sectionTitle ? <span className="question-section-title">{sectionTitle}</span> : null}
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
