import type { ReactNode } from "react";

type SurveyLayoutProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function SurveyLayout({ children, eyebrow, title, description, actions }: SurveyLayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/survey" aria-label="ThaiPass survey home">
          <img src="/ThaiPass_Logo.svg" alt="ThaiPass" />
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href="/survey">Survey</a>
          <a href="/results">Results</a>
        </nav>
      </header>

      <main>
        <section className="page-hero">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <div className="hero-copy">
            <div>
              <h1>{title}</h1>
              {description ? <p>{description}</p> : null}
            </div>
            {actions ? <div className="hero-actions">{actions}</div> : null}
          </div>
        </section>

        {children}
      </main>
    </div>
  );
}
