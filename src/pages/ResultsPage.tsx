import { FormEvent, useEffect, useMemo, useState } from "react";
import { SurveyLayout } from "../components/SurveyLayout";
import { surveyQuestions } from "../data/surveyQuestions";
import type { Question, SurveyResponse } from "../types";
import { exportToPDF } from "../utils/pdf";
import {
  calculateAnswerShare,
  calculateMultipleAnswerShare,
  calculateSingleChoicePercentages,
  calculateMultipleChoicePercentages,
  formatDate,
  formatDateTime,
  formatTime,
  getMostCommonAnswer,
} from "../utils/results";
import { type Language, useLanguage } from "../utils/language";
import { clearResponses, getResponses, loadResponses, restoreResponse, softDeleteResponse } from "../utils/storage";

const RESULTS_PASSWORD = "Thaipass2026";

const responseDetailFields = [
  { label: "Nationality", questionId: "nationality" },
  { label: "Thailand travel status", questionId: "visitStatus" },
  { label: "Preparation area ratings", questionId: "preparationAreas" },
  { label: "Advance travel services", questionId: "advanceTravelServices" },
  { label: "Decision factors", questionId: "decisionFactors" },
];

function answerPreview(answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  if (typeof answer === "number") {
    return `${answer}/5`;
  }
  if (answer && typeof answer === "object") {
    return Object.entries(answer)
      .map(([item, rating]) => `${item}: ${rating}`)
      .join(", ");
  }
  return String(answer ?? "-");
}

function otherTextForQuestion(responses: SurveyResponse[], questionId: string) {
  return responses
    .map((response) => response.otherAnswers[questionId])
    .filter((text): text is string => Boolean(text?.trim()));
}

function answerWithOther(response: SurveyResponse, questionId: string) {
  const answer = answerPreview(response.answers[questionId]);
  const otherText = response.otherAnswers[questionId];
  return otherText?.trim() ? `${answer} (${otherText})` : answer;
}

function textForQuestion(responses: SurveyResponse[], questionId: string) {
  return responses
    .map((response) => response.answers[questionId])
    .filter((answer): answer is string => typeof answer === "string" && answer.trim().length > 0);
}

function otherTextPreview(response: SurveyResponse) {
  const entries = Object.entries(response.otherAnswers).filter(([, text]) => text.trim());
  if (!entries.length) {
    return "-";
  }

  return entries
    .map(([questionId, text]) => {
      const questionIndex = surveyQuestions.findIndex((question) => question.id === questionId);
      const label = questionIndex >= 0 ? `Q${questionIndex + 1}` : questionId;
      return `${label}: ${text}`;
    })
    .join("; ");
}

function getQuestion(questionId: string) {
  return surveyQuestions.find((question) => question.id === questionId);
}

function getPercentages(question: Question, responses: SurveyResponse[]) {
  if (question.type === "single") {
    return calculateSingleChoicePercentages(question, responses);
  }
  if (question.type === "multiple") {
    return calculateMultipleChoicePercentages(question, responses);
  }
  return [];
}

function getMatrixPercentages(question: Question, responses: SurveyResponse[]) {
  if (question.type !== "rating") {
    return [];
  }

  const options = question.scaleOptions ?? [1, 2, 3, 4, 5];

  return question.items.map((item) => ({
    item,
    summaries: options.map((option) => {
      const count = responses.reduce((total, response) => {
        const answer = response.answers[question.id];
        return total + (answer && typeof answer === "object" && !Array.isArray(answer) && answer[item] === option ? 1 : 0);
      }, 0);

      return {
        option: String(option),
        count,
        percentage: responses.length ? Math.round((count / responses.length) * 100) : 0,
      };
    }),
  }));
}

function PasswordGate({
  language,
  onLanguageChange,
  t,
  onAuthenticated,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  t: (text: string | undefined) => string;
  onAuthenticated: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    window.setTimeout(() => {
      if (password.trim() === RESULTS_PASSWORD) {
        onAuthenticated();
        return;
      }

      setIsLoading(false);
      setError("Incorrect password. Please try again.");
    }, 350);
  }

  return (
    <SurveyLayout
      eyebrow="Internal review"
      title="Survey Results"
      description="Concept Validation Survey"
      language={language}
      onLanguageChange={onLanguageChange}
    >
      <section className="password-card">
        <h2>{t("Survey Results")}</h2>
        <p>{t("Survey results are available for internal review only.")}</p>
        {/* Replace this client-side gate with backend authentication before production. */}
        <form className="password-form" onSubmit={handleSubmit}>
          <label>
            <span>{t("Enter password")}</span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder={t("Enter password")}
            />
          </label>
          <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)}>
            {showPassword ? t("Hide password") : t("Show password")}
          </button>
          {error ? <p className="field-error">{t(error)}</p> : null}
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? t("Checking password...") : t("View results")}
          </button>
        </form>
      </section>
    </SurveyLayout>
  );
}

export function ResultsPage() {
  const { language, setLanguage, t } = useLanguage();
  // This client-side password gate is only for internal review. Replace with backend authentication before production.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [responses, setResponses] = useState<SurveyResponse[]>(() => getResponses());
  const [activeView, setActiveView] = useState<"summary" | "individual">("summary");
  const [selectedNationality, setSelectedNationality] = useState("all");
  const [selectedResponseId, setSelectedResponseId] = useState<string | undefined>();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [responseError, setResponseError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function syncResponses() {
      setIsLoadingResponses(true);
      setResponseError("");

      try {
        const nextResponses = await loadResponses();
        if (isActive) {
          setResponses(nextResponses);
        }
      } catch {
        if (isActive) {
          setResponses(getResponses());
          setResponseError("Could not load shared responses. Showing saved responses from this browser.");
        }
      } finally {
        if (isActive) {
          setIsLoadingResponses(false);
        }
      }
    }

    window.addEventListener("storage", syncResponses);
    window.addEventListener("thaipass-survey-updated", syncResponses);
    syncResponses();

    return () => {
      isActive = false;
      window.removeEventListener("storage", syncResponses);
      window.removeEventListener("thaipass-survey-updated", syncResponses);
    };
  }, []);

  const sortedResponses = useMemo(
    () => [...responses].sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime()),
    [responses],
  );

  const nationalityOptions = useMemo(() => {
    const nationalities = sortedResponses
      .map((response) => response.answers.nationality)
      .filter((answer): answer is string => typeof answer === "string" && answer.trim().length > 0);
    return Array.from(new Set(nationalities)).sort((first, second) => first.localeCompare(second));
  }, [sortedResponses]);

  const filteredResponses = useMemo(() => {
    if (selectedNationality === "all") {
      return sortedResponses;
    }

    return sortedResponses.filter((response) => response.answers.nationality === selectedNationality);
  }, [selectedNationality, sortedResponses]);

  const activeResponses = useMemo(() => filteredResponses.filter((response) => !response.deletedAt), [filteredResponses]);
  const deletedResponsesCount = filteredResponses.length - activeResponses.length;
  const selectedResponse = filteredResponses.find((response) => response.id === selectedResponseId) ?? filteredResponses[0];

  const mostCommonNationality = getMostCommonAnswer(activeResponses, "nationality");
  const planningInterest = calculateAnswerShare(activeResponses, "visitStatus", [
    "No, but I am planning to visit",
    "No, but I am interested in visiting",
  ]);
  const verifiedBadgeFactor = calculateMultipleAnswerShare(activeResponses, "decisionFactors", "Official partner / verified provider badge");
  const customerSupportFactor = calculateMultipleAnswerShare(activeResponses, "decisionFactors", "Customer support contact");
  const lastUpdated = activeResponses[0] ? formatDateTime(activeResponses[0].timestamp) : "No active responses yet";

  async function refreshResponses() {
    const nextResponses = await loadResponses();
    setResponses(nextResponses);
  }

  async function handleClearResponses() {
    try {
      await clearResponses();
      await refreshResponses();
      setSelectedResponseId(undefined);
      setSelectedNationality("all");
      setIsClearConfirmOpen(false);
    } catch {
      setResponseError("Could not update shared responses. Please try again.");
    }
  }

  async function handleSoftDeleteResponse(responseId: string) {
    try {
      await softDeleteResponse(responseId);
      await refreshResponses();
    } catch {
      setResponseError("Could not update shared responses. Please try again.");
    }
  }

  async function handleRestoreResponse(responseId: string) {
    try {
      await restoreResponse(responseId);
      await refreshResponses();
    } catch {
      setResponseError("Could not update shared responses. Please try again.");
    }
  }

  if (!isAuthenticated) {
    return (
      <PasswordGate
        language={language}
        onLanguageChange={setLanguage}
        t={t}
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <SurveyLayout
      eyebrow="Admin dashboard"
      title="ThaiPass Survey Results"
      description="Concept Validation Survey"
      language={language}
      onLanguageChange={setLanguage}
      actions={
        <div className="dashboard-actions">
          <button className="clear-results-button" type="button" onClick={() => setIsClearConfirmOpen(true)} disabled={!responses.length}>
            {t("Clear results")}
          </button>
          <button className="secondary-button" type="button" onClick={() => exportToPDF(activeResponses)} disabled={!activeResponses.length}>
            {t("Export PDF")}
          </button>
        </div>
      }
    >
      <section className="dashboard-header-card">
        <div>
          <span>Total responses</span>
          <strong>Total responses: {activeResponses.length}</strong>
          {deletedResponsesCount ? <p>{deletedResponsesCount} soft-deleted</p> : null}
        </div>
        <div>
          <span>Last updated</span>
          <strong>{lastUpdated}</strong>
        </div>
      </section>
      {isLoadingResponses ? <p className="results-status">Loading responses...</p> : null}
      {responseError ? <p className="field-error">{responseError}</p> : null}

      <div className="results-view-tabs" aria-label="Results views">
        <button
          className={activeView === "summary" ? "is-active" : ""}
          type="button"
          onClick={() => setActiveView("summary")}
        >
          Summary
        </button>
        <button
          className={activeView === "individual" ? "is-active" : ""}
          type="button"
          onClick={() => setActiveView("individual")}
        >
          Individual responses
        </button>
      </div>

      <section className="results-filter-card" aria-label="Results filters">
        <label>
          <span>Filter by nationality</span>
          <select value={selectedNationality} onChange={(event) => setSelectedNationality(event.target.value)}>
            <option value="all">All nationalities</option>
            {nationalityOptions.map((nationality) => (
              <option key={nationality} value={nationality}>
                {nationality}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!sortedResponses.length ? (
        <section className="empty-state">
          <h2>No survey responses yet.</h2>
          <p>Share the survey link to start collecting responses.</p>
          <a className="primary-button" href="/survey">Open survey</a>
        </section>
      ) : (
        <>
          {activeView === "summary" ? (
            <>
              <section className="metrics-grid overview-grid">
                <article className="metric-card">
                  <span>Planning or interested</span>
                  <strong>{planningInterest.percentage}%</strong>
                  <p>Planning to visit or interested in visiting</p>
                  <p className="metric-insight">This helps show whether respondents are close to the Thailand travel moment.</p>
                </article>
                <article className="metric-card">
                  <span>Most common nationality</span>
                  <strong>{mostCommonNationality?.answer ?? "N/A"}</strong>
                  <p>{mostCommonNationality ? `${mostCommonNationality.count} responses` : "No data yet"}</p>
                </article>
                <article className="metric-card">
                  <span>Verified badge matters</span>
                  <strong>{verifiedBadgeFactor.percentage}%</strong>
                  <p>Selected official partner / verified badge</p>
                </article>
                <article className="metric-card">
                  <span>Customer support matters</span>
                  <strong>{customerSupportFactor.percentage}%</strong>
                  <p>Selected customer support</p>
                </article>
              </section>

              <section className="results-grid">
                {surveyQuestions.map((question, index) => {
                  return (
                    <article className="result-card" key={question.id}>
                      <div className="result-heading">
                        <span>Q{index + 1}</span>
                        <h2>{question.title}</h2>
                      </div>

                      <div className="bar-list">
                        {getPercentages(question, activeResponses).map((summary) => (
                          <div className="bar-row" key={summary.option}>
                            <div className="bar-row-label">
                              <span>{summary.option}</span>
                              <strong>
                                {summary.count} responses ({summary.percentage}%)
                              </strong>
                            </div>
                            <div className="bar-track">
                              <span style={{ width: `${summary.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {question.type === "rating" ? (
                        <div className="matrix-results">
                          {getMatrixPercentages(question, activeResponses).map((itemSummary) => (
                            <div className="matrix-result-item" key={itemSummary.item}>
                              <strong>{itemSummary.item}</strong>
                              <div className="bar-list">
                                {itemSummary.summaries.map((summary) => (
                                  <div className="bar-row" key={`${itemSummary.item}-${summary.option}`}>
                                    <div className="bar-row-label">
                                      <span>{summary.option}</span>
                                      <strong>
                                        {summary.count} responses ({summary.percentage}%)
                                      </strong>
                                    </div>
                                    <div className="bar-track">
                                      <span style={{ width: `${summary.percentage}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {question.type === "text" && textForQuestion(activeResponses, question.id).length ? (
                        <div className="other-summary">
                          <strong>Text responses</strong>
                          <ul>
                            {textForQuestion(activeResponses, question.id).map((text, textIndex) => (
                              <li key={`${text}-${textIndex}`}>{text}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {otherTextForQuestion(activeResponses, question.id).length ? (
                        <div className="other-summary">
                          <strong>Other text responses</strong>
                          <ul>
                            {otherTextForQuestion(activeResponses, question.id).map((text, otherIndex) => (
                              <li key={`${text}-${otherIndex}`}>{text}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </section>
            </>
          ) : (
            <section className="responses-section">
              <div className="section-heading">
                <h2>Individual responses</h2>
                <p>
                  {activeResponses.length} active, {deletedResponsesCount} soft-deleted. Deleted responses can be restored.
                </p>
              </div>
              {filteredResponses.length ? (
                <div className="response-browser">
                  <div className="response-list" aria-label="Response list">
                    {filteredResponses.map((response, index) => {
                      const isSelected = selectedResponse?.id === response.id;
                      return (
                        <button
                          className={`response-list-item ${isSelected ? "is-selected" : ""} ${response.deletedAt ? "is-deleted" : ""}`}
                          key={response.id}
                          type="button"
                          onClick={() => setSelectedResponseId(response.id)}
                        >
                          <span>Response {filteredResponses.length - index}</span>
                          <strong>{answerWithOther(response, "nationality")}</strong>
                          <small>{formatDate(response.timestamp)}, {formatTime(response.timestamp)}</small>
                          {response.deletedAt ? <em>Deleted</em> : null}
                        </button>
                      );
                    })}
                  </div>

                  {selectedResponse ? (
                    <article className={`response-detail ${selectedResponse.deletedAt ? "is-deleted" : ""}`}>
                      <div className="response-detail-header">
                        <div>
                          <span>{formatDate(selectedResponse.timestamp)}, {formatTime(selectedResponse.timestamp)}</span>
                          <h3>{answerWithOther(selectedResponse, "nationality")}</h3>
                        </div>
                        <div className="response-detail-actions">
                          {selectedResponse.deletedAt ? (
                            <>
                              <span className="status-pill is-deleted">Deleted {formatDateTime(selectedResponse.deletedAt)}</span>
                              <button className="table-action-button" type="button" onClick={() => handleRestoreResponse(selectedResponse.id)}>
                                Restore
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="status-pill">Active</span>
                              <button
                                className="table-action-button is-danger"
                                type="button"
                                onClick={() => handleSoftDeleteResponse(selectedResponse.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <dl className="response-detail-grid">
                        {responseDetailFields.map((field) => (
                          <div key={field.questionId}>
                            <dt>{field.label}</dt>
                            <dd>{getQuestion(field.questionId) ? answerWithOther(selectedResponse, field.questionId) : "N/A"}</dd>
                          </div>
                        ))}
                        <div>
                          <dt>Other text</dt>
                          <dd>{otherTextPreview(selectedResponse)}</dd>
                        </div>
                      </dl>
                    </article>
                  ) : null}
                </div>
              ) : (
                <div className="empty-state compact-empty">
                  <h2>No responses for this nationality.</h2>
                  <p>Change the filter to see more responses.</p>
                </div>
              )}
            </section>
          )}
        </>
      )}
      {isClearConfirmOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="clear-results-title">
            <h2 id="clear-results-title">{t("Clear all results?")}</h2>
            <p>{t("This will permanently remove all survey responses from this browser, including soft-deleted responses.")}</p>
            <div className="confirm-modal-actions">
              <button className="secondary-button" type="button" onClick={() => setIsClearConfirmOpen(false)}>
                {t("Cancel")}
              </button>
              <button className="danger-button" type="button" onClick={handleClearResponses}>
                {t("Clear results")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </SurveyLayout>
  );
}
