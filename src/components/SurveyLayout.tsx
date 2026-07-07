import type { ReactNode } from "react";
import type { Language } from "../utils/language";
import { translate } from "../utils/language";

type SurveyLayoutProps = {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  language?: Language;
  onLanguageChange?: (language: Language) => void;
};

export function SurveyLayout({
  children,
  eyebrow,
  title,
  description,
  actions,
  language = "en",
  onLanguageChange,
}: SurveyLayoutProps) {
  const t = (text: string | undefined) => translate(text, language);
  const nextLanguage: Language = language === "en" ? "zh" : "en";

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/survey" aria-label="ThaiPass survey home">
          <img src="/ThaiPass_Logo.svg" alt="ThaiPass" />
        </a>
        <div className="topbar-actions">
          <nav className="topnav" aria-label="Primary">
            <a href="/survey">{t("Survey")}</a>
            <a href="/results">{t("Results")}</a>
          </nav>
          {onLanguageChange ? (
            <div className="language-switch" aria-label="Language">
              <button
                className="language-icon-button"
                type="button"
                onClick={() => onLanguageChange(nextLanguage)}
                aria-label={`Switch language to ${nextLanguage === "zh" ? "Chinese" : "English"}`}
                title={`Switch language to ${nextLanguage === "zh" ? "Chinese" : "English"}`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18" />
                  <path d="M12 3c2.3 2.4 3.5 5.4 3.5 9s-1.2 6.6-3.5 9" />
                  <path d="M12 3c-2.3 2.4-3.5 5.4-3.5 9s1.2 6.6 3.5 9" />
                </svg>
                <span className="sr-only">Switch language</span>
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main>
        <section className="page-hero">
          {eyebrow ? <p className="eyebrow">{t(eyebrow)}</p> : null}
          <div className="hero-copy">
            <div>
              <h1>{t(title)}</h1>
              {description ? <p>{t(description)}</p> : null}
            </div>
            {actions ? <div className="hero-actions">{actions}</div> : null}
          </div>
        </section>

        {children}
      </main>
    </div>
  );
}
