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
              {(["en", "zh"] as Language[]).map((item) => (
                <button
                  className={language === item ? "is-active" : ""}
                  key={item}
                  type="button"
                  onClick={() => onLanguageChange(item)}
                  aria-label={item === "zh" ? "Chinese" : "English"}
                  title={item === "zh" ? "Chinese" : "English"}
                >
                  {item === "zh" ? "🇨🇳" : "🇬🇧"}
                </button>
              ))}
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
