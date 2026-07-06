import { FormEvent, useEffect, useMemo, useState } from "react";
import { SurveyLayout } from "../components/SurveyLayout";
import { surveyQuestions } from "../data/surveyQuestions";
import type { Question, SurveyResponse } from "../types";
import { exportToCSV } from "../utils/csv";
import {
  calculateAnswerShare,
  calculateAverageScore,
  calculatePositiveNeutralNegativeSummary,
  calculateSingleChoicePercentages,
  calculateMultipleChoicePercentages,
  formatDate,
  formatDateTime,
  formatTime,
  getMostCommonAnswer,
} from "../utils/results";
import { clearResponses, getResponses } from "../utils/storage";

const RESULTS_PASSWORD = "Thaipass2026";
const AUTH_STORAGE_KEY = "thaipass-results-authenticated";

const sentimentConfigs: Record<
  string,
  {
    title: string;
    positive: string[];
    neutral: string[];
    negative: string[];
  }
> = {
  conceptClarity: {
    title: "Concept clarity",
    positive: ["Very clear", "Somewhat clear"],
    neutral: ["Neutral"],
    negative: ["Not very clear", "Not clear at all"],
  },
  travelAssistantUsefulness: {
    title: "Usefulness",
    positive: ["Very useful", "Somewhat useful"],
    neutral: ["Neutral"],
    negative: ["Not very useful", "Not useful at all"],
  },
  downloadLikelihood: {
    title: "Download intent",
    positive: ["Very likely", "Somewhat likely"],
    neutral: ["Not sure"],
    negative: ["Somewhat unlikely", "Very unlikely"],
  },
  travelComparison: {
    title: "Compared to current travel",
    positive: ["Much better", "Somewhat better"],
    neutral: ["About the same", "I’m not sure"],
    negative: ["Worse"],
  },
};

function answerPreview(answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.join(", ");
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

function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password === RESULTS_PASSWORD) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
      onAuthenticated();
      return;
    }

    setError("Incorrect password. Please try again.");
  }

  return (
    <SurveyLayout
      eyebrow="Admin dashboard"
      title="ThaiPass Survey Results"
      description="Concept Validation Survey"
    >
      <section className="password-card">
        <h2>Enter results password</h2>
        <p>Survey results are available for internal review only.</p>
        {/* Replace this client-side gate with backend authentication before production. */}
        <form className="password-form" onSubmit={handleSubmit}>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter password"
            />
          </label>
          {error ? <p className="field-error">{error}</p> : null}
          <button className="primary-button" type="submit">
            View results
          </button>
        </form>
      </section>
    </SurveyLayout>
  );
}

export function ResultsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem(AUTH_STORAGE_KEY) === "true");
  const [responses, setResponses] = useState<SurveyResponse[]>(() => getResponses());

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

  const mostCommonNationality = getMostCommonAnswer(sortedResponses, "nationality");
  const conceptClarityAverage = calculateAverageScore(sortedResponses, "conceptClarity", {
    "Very clear": 5,
    "Somewhat clear": 4,
    Neutral: 3,
    "Not very clear": 2,
    "Not clear at all": 1,
  });
  const downloadIntent = calculateAnswerShare(sortedResponses, "downloadLikelihood", ["Very likely", "Somewhat likely"]);
  const betterThanCurrent = calculateAnswerShare(sortedResponses, "travelComparison", ["Much better", "Somewhat better"]);
  const lastUpdated = sortedResponses[0] ? formatDateTime(sortedResponses[0].timestamp) : "No responses yet";

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
          <button className="secondary-button" type="button" onClick={() => exportToCSV(sortedResponses)} disabled={!sortedResponses.length}>
            Export CSV
          </button>
          <button className="ghost-button" type="button" onClick={() => clearResponses()} disabled={!sortedResponses.length}>
            Clear local results
          </button>
        </div>
      }
    >
      <section className="dashboard-header-card">
        <div>
          <span>Total responses</span>
          <strong>{sortedResponses.length}</strong>
        </div>
        <div>
          <span>Last updated</span>
          <strong>{lastUpdated}</strong>
        </div>
      </section>

      {!sortedResponses.length ? (
        <section className="empty-state">
          <h2>No survey responses yet.</h2>
          <p>Share the survey link to start collecting responses.</p>
          <a className="primary-button" href="/survey">Open survey</a>
        </section>
      ) : (
        <>
          <section className="metrics-grid overview-grid">
            <article className="metric-card">
              <span>Total responses</span>
              <strong>{sortedResponses.length}</strong>
            </article>
            <article className="metric-card">
              <span>Most common nationality</span>
              <strong>{mostCommonNationality?.answer ?? "N/A"}</strong>
              <p>{mostCommonNationality ? `${mostCommonNationality.count} responses` : "No data yet"}</p>
            </article>
            <article className="metric-card">
              <span>Average concept clarity</span>
              <strong>{conceptClarityAverage ? `${conceptClarityAverage}/5` : "N/A"}</strong>
            </article>
            <article className="metric-card">
              <span>Download intent</span>
              <strong>{downloadIntent.percentage}%</strong>
              <p>Very likely or somewhat likely</p>
            </article>
            <article className="metric-card">
              <span>ThaiPass feels better</span>
              <strong>{betterThanCurrent.percentage}%</strong>
              <p>Much better or somewhat better</p>
            </article>
          </section>

          <section className="results-grid">
            {surveyQuestions.map((question, index) => {
              const sentimentConfig = sentimentConfigs[question.id];
              const sentiment = sentimentConfig
                ? calculatePositiveNeutralNegativeSummary(
                    question.id,
                    sortedResponses,
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
                    {getPercentages(question, sortedResponses).map((summary) => (
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

                  {otherTextForQuestion(sortedResponses, question.id).length ? (
                    <div className="other-summary">
                      <strong>Other text responses</strong>
                      <ul>
                        {otherTextForQuestion(sortedResponses, question.id).map((text, otherIndex) => (
                          <li key={`${text}-${otherIndex}`}>{text}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>

          <section className="responses-section">
            <div className="section-heading">
              <h2>Individual responses</h2>
              <p>{sortedResponses.length} response{sortedResponses.length === 1 ? "" : "s"} sorted newest first.</p>
            </div>
            <div className="responses-table-wrap">
              <table className="responses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Nationality</th>
                    <th>Thailand travel status</th>
                    <th>Preparation difficulty</th>
                    <th>Biggest concerns</th>
                    <th>Concept clarity</th>
                    <th>Best matching description</th>
                    <th>Usefulness</th>
                    <th>Most valuable concept parts</th>
                    <th>Download likelihood</th>
                    <th>Compared to current travel</th>
                    <th>Download / not download reason</th>
                    <th>Trust factors</th>
                    <th>Other text</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResponses.map((response) => (
                    <tr key={response.id}>
                      <td>{formatDate(response.timestamp)}</td>
                      <td>{formatTime(response.timestamp)}</td>
                      <td>{answerWithOther(response, "nationality")}</td>
                      <td>{answerWithOther(response, "visitStatus")}</td>
                      <td>{answerWithOther(response, "preparationDifficulty")}</td>
                      <td>{answerWithOther(response, "travelConcerns")}</td>
                      <td>{answerWithOther(response, "conceptClarity")}</td>
                      <td>{answerWithOther(response, "conceptDescription")}</td>
                      <td>{answerWithOther(response, "travelAssistantUsefulness")}</td>
                      <td>{answerWithOther(response, "valuableConceptParts")}</td>
                      <td>{answerWithOther(response, "downloadLikelihood")}</td>
                      <td>{getQuestion("travelComparison") ? answerWithOther(response, "travelComparison") : "N/A"}</td>
                      <td>{answerWithOther(response, "downloadReason")}</td>
                      <td>{answerWithOther(response, "trustSignals")}</td>
                      <td>{otherTextPreview(response)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </SurveyLayout>
  );
}
