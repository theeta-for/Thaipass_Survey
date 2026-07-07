import { FormEvent, useEffect, useMemo, useState } from "react";
import { SurveyLayout } from "../components/SurveyLayout";
import { surveyQuestions } from "../data/surveyQuestions";
import type { Question, SurveyResponse } from "../types";
import { exportToPDF } from "../utils/pdf";
import {
  calculateAverageNumericScore,
  calculateMultipleAnswerShare,
  calculatePositiveNeutralNegativeSummary,
  calculateScaleShare,
  calculateScalePercentages,
  calculateSingleChoicePercentages,
  calculateMultipleChoicePercentages,
  formatDate,
  formatDateTime,
  formatTime,
  getMostCommonAnswer,
} from "../utils/results";
import { getResponses, restoreResponse, softDeleteResponse } from "../utils/storage";

const RESULTS_PASSWORD = "Thaipass2026";
const RESULTS_AUTH_KEY = "thaipass-results-authenticated";

const sentimentConfigs: Record<
  string,
  {
    title: string;
    positive: string[];
    neutral: string[];
    negative: string[];
  }
> = {
  preferredPlatform: {
    title: "Platform preference",
    positive: ["Website", "Mobile app", "Existing travel platform"],
    neutral: ["Not sure"],
    negative: [],
  },
};

const responseDetailFields = [
  { label: "Country", questionId: "nationality" },
  { label: "Travel experience", questionId: "visitStatus" },
  { label: "Most stressful preparation", questionId: "stressfulPreparation" },
  { label: "Usefulness score", questionId: "usefulnessScore" },
  { label: "Useful before arrival", questionId: "beforeArrivalFeatures" },
  { label: "Useful during trip", questionId: "duringTripFeatures" },
  { label: "Concept clarity score", questionId: "conceptClarityScore" },
  { label: "Trust factors", questionId: "trustFactors" },
  { label: "Preferred platform", questionId: "preferredPlatform" },
  { label: "Additional feedback", questionId: "additionalFeedback" },
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
  if (question.type === "scale") {
    return calculateScalePercentages(question, responses);
  }
  return [];
}

function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    window.setTimeout(() => {
      if (password.trim() === RESULTS_PASSWORD) {
        sessionStorage.setItem(RESULTS_AUTH_KEY, "true");
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
    >
      <section className="password-card">
        <h2>Survey Results</h2>
        <p>Survey results are available for internal review only.</p>
        {/* Replace this client-side gate with backend authentication before production. */}
        <form className="password-form" onSubmit={handleSubmit}>
          <label>
            <span>Enter password</span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter password"
            />
          </label>
          <button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)}>
            {showPassword ? "Hide password" : "Show password"}
          </button>
          {error ? <p className="field-error">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? "Checking password..." : "View results"}
          </button>
        </form>
      </section>
    </SurveyLayout>
  );
}

export function ResultsPage() {
  // This client-side password gate is only for internal review. Replace with backend authentication before production.
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(RESULTS_AUTH_KEY) === "true");
  const [responses, setResponses] = useState<SurveyResponse[]>(() => getResponses());
  const [activeView, setActiveView] = useState<"summary" | "individual">("summary");
  const [selectedNationality, setSelectedNationality] = useState("all");
  const [selectedResponseId, setSelectedResponseId] = useState<string | undefined>();

  useEffect(() => {
    function syncResponses() {
      setResponses(getResponses());
    }

    window.addEventListener("storage", syncResponses);
    window.addEventListener("thaipass-survey-updated", syncResponses);
    return () => {
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
  const usefulnessAverage = calculateAverageNumericScore(activeResponses, "usefulnessScore");
  const usefulShare = calculateScaleShare(activeResponses, "usefulnessScore", 4);
  const clarityShare = calculateScaleShare(activeResponses, "conceptClarityScore", 4);
  const checklistShare = calculateMultipleAnswerShare(activeResponses, "beforeArrivalFeatures", "Pre-arrival checklist");
  const entryStressShare = calculateMultipleAnswerShare(activeResponses, "stressfulPreparation", "Understanding entry requirements");
  const lastUpdated = activeResponses[0] ? formatDateTime(activeResponses[0].timestamp) : "No active responses yet";

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <SurveyLayout
      eyebrow="Admin dashboard"
      title="ThaiPass Survey Results"
      description="Concept Validation Survey"
      actions={
        <div className="dashboard-actions">
          <button className="secondary-button" type="button" onClick={() => exportToPDF(activeResponses)} disabled={!activeResponses.length}>
            Export PDF
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
          <span>Filter by country</span>
          <select value={selectedNationality} onChange={(event) => setSelectedNationality(event.target.value)}>
            <option value="all">All countries</option>
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
                  <span>ThaiPass usefulness</span>
                  <strong>{usefulShare.percentage}%</strong>
                  <p>Rated 4 or 5 out of 5</p>
                  <p className="metric-insight">This suggests whether the core travel assistant concept has strong potential.</p>
                </article>
                <article className="metric-card">
                  <span>Most common country</span>
                  <strong>{mostCommonNationality?.answer ?? "N/A"}</strong>
                  <p>{mostCommonNationality ? `${mostCommonNationality.count} responses` : "No data yet"}</p>
                </article>
                <article className="metric-card">
                  <span>Average usefulness score</span>
                  <strong>{usefulnessAverage ? `${usefulnessAverage}/5` : "N/A"}</strong>
                </article>
                <article className="metric-card">
                  <span>Value clarity</span>
                  <strong>{clarityShare.percentage}%</strong>
                  <p>Rated 4 or 5 after seeing the concept</p>
                </article>
                <article className="metric-card">
                  <span>Pre-arrival checklist</span>
                  <strong>{checklistShare.percentage}%</strong>
                  <p>Selected as a useful before-arrival feature</p>
                  <p className="metric-insight">This points to trip preparation as a likely priority area.</p>
                </article>
                <article className="metric-card">
                  <span>Entry requirements stress</span>
                  <strong>{entryStressShare.percentage}%</strong>
                  <p>Selected as a stressful preparation area</p>
                </article>
              </section>

              <section className="results-grid">
                {surveyQuestions.map((question, index) => {
                  const sentimentConfig = sentimentConfigs[question.id];
                  const sentiment = sentimentConfig
                    ? calculatePositiveNeutralNegativeSummary(
                        question.id,
                        activeResponses,
                        sentimentConfig.positive,
                        sentimentConfig.neutral,
                        sentimentConfig.negative,
                      )
                    : undefined;

                  return (
                    <article className="result-card" key={question.id}>
                      <div className="result-heading">
                        <span>Q{index + 1}</span>
                        <h2>{question.title}</h2>
                      </div>

                      {sentiment ? (
                        <div className="sentiment-summary">
                          <div>
                            <span>Positive</span>
                            <strong>{sentiment.positivePercentage}%</strong>
                            <small>{sentiment.positive} responses</small>
                          </div>
                          <div>
                            <span>Neutral</span>
                            <strong>{sentiment.neutralPercentage}%</strong>
                            <small>{sentiment.neutral} responses</small>
                          </div>
                          <div>
                            <span>Negative</span>
                            <strong>{sentiment.negativePercentage}%</strong>
                            <small>{sentiment.negative} responses</small>
                          </div>
                        </div>
                      ) : null}

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
                              <button className="table-action-button" type="button" onClick={() => restoreResponse(selectedResponse.id)}>
                                Restore
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="status-pill">Active</span>
                              <button
                                className="table-action-button is-danger"
                                type="button"
                                onClick={() => softDeleteResponse(selectedResponse.id)}
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
    </SurveyLayout>
  );
}
