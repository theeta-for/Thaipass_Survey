import { useEffect, useMemo, useState } from "react";
import { SurveyLayout } from "../components/SurveyLayout";
import { surveyQuestions } from "../data/surveyQuestions";
import type { SurveyResponse } from "../types";
import { downloadResponsesCsv } from "../utils/csv";
import { summarizeChoiceQuestion, summarizeRatingQuestion } from "../utils/results";
import { clearResponses, getResponses } from "../utils/storage";

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function answerPreview(answer: unknown) {
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  if (answer && typeof answer === "object") {
    return Object.entries(answer)
      .map(([item, rating]) => `${item}: ${rating}`)
      .join(", ");
  }
  return String(answer ?? "");
}

function otherTextForQuestion(responses: SurveyResponse[], questionId: string) {
  return responses
    .map((response) => response.otherAnswers[questionId])
    .filter((text): text is string => Boolean(text?.trim()));
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

export function ResultsPage() {
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

  const completionDate = useMemo(() => {
    if (!responses[0]) {
      return "No responses yet";
    }
    return `Latest response: ${formatDate(responses[0].timestamp)}`;
  }, [responses]);

  return (
    <SurveyLayout
      eyebrow="Admin dashboard"
      title="Survey results"
      description="Review ThaiPass survey responses, spot patterns, and export the data."
      actions={
        <div className="dashboard-actions">
          <button className="secondary-button" type="button" onClick={() => downloadResponsesCsv(responses)} disabled={!responses.length}>
            Export CSV
          </button>
          <button className="ghost-button" type="button" onClick={() => clearResponses()} disabled={!responses.length}>
            Clear local results
          </button>
        </div>
      }
    >
      <section className="metrics-grid">
        <article className="metric-card">
          <span>Total responses</span>
          <strong>{responses.length}</strong>
        </article>
        <article className="metric-card">
          <span>Status</span>
          <strong>{responses.length ? "Collecting data" : "Waiting"}</strong>
          <p>{completionDate}</p>
        </article>
      </section>

      {!responses.length ? (
        <section className="empty-state">
          <h2>No responses yet</h2>
          <p>Submit the public survey once and this dashboard will fill in automatically.</p>
          <a className="primary-button" href="/survey">Open survey</a>
        </section>
      ) : (
        <>
          <section className="results-grid">
            {surveyQuestions.map((question, index) => (
              <article className="result-card" key={question.id}>
                <div className="result-heading">
                  <span>Q{index + 1}</span>
                  <h2>{question.title}</h2>
                </div>

                {question.type === "rating" ? (
                  <div className="rating-summary">
                    {summarizeRatingQuestion(question, responses).map((summary) => (
                      <div className="rating-summary-row" key={summary.item}>
                        <div>
                          <strong>{summary.item}</strong>
                          <span>{summary.count} ratings</span>
                        </div>
                        <div className="score-pill">{summary.average || "N/A"}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bar-list">
                    {summarizeChoiceQuestion(question, responses).map((summary) => (
                      <div className="bar-row" key={summary.option}>
                        <div className="bar-row-label">
                          <span>{summary.option}</span>
                          <strong>
                            {summary.count} ({summary.percentage}%)
                          </strong>
                        </div>
                        <div className="bar-track">
                          <span style={{ width: `${summary.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {otherTextForQuestion(responses, question.id).length ? (
                  <div className="other-summary">
                    <strong>Other text responses</strong>
                    <ul>
                      {otherTextForQuestion(responses, question.id).map((text, otherIndex) => (
                        <li key={`${text}-${otherIndex}`}>{text}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </section>

          <section className="responses-section">
            <div className="section-heading">
              <h2>Individual responses</h2>
              <p>{responses.length} response{responses.length === 1 ? "" : "s"} saved in this browser.</p>
            </div>
            <div className="responses-table-wrap">
              <table className="responses-table">
                <thead>
                  <tr>
                    <th>Submitted</th>
                    {surveyQuestions.map((question, index) => (
                      <th key={question.id}>Q{index + 1}</th>
                    ))}
                    <th>Other text</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response) => (
                    <tr key={response.id}>
                      <td>{formatDate(response.timestamp)}</td>
                      {surveyQuestions.map((question) => (
                        <td key={question.id}>{answerPreview(response.answers[question.id])}</td>
                      ))}
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
