import { surveyQuestions } from "../data/surveyQuestions";
import type { SurveyResponse } from "../types";
import { formatDate, formatTime } from "./results";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function answerToCsvValue(response: SurveyResponse, questionId: string) {
  const answer = response.answers[questionId];
  if (Array.isArray(answer)) {
    return answer.join("; ");
  }
  if (answer && typeof answer === "object") {
    return Object.entries(answer)
      .map(([item, rating]) => `${item}: ${rating}`)
      .join("; ");
  }
  return answer ?? "";
}

export function exportToCSV(responses: SurveyResponse[]) {
  const headers = [
    "Response ID",
    "Timestamp",
    "Date",
    "Time",
    ...surveyQuestions.map((question) => question.title),
    "Other responses",
  ];

  const rows = responses.map((response) => [
    response.id,
    response.timestamp,
    formatDate(response.timestamp),
    formatTime(response.timestamp),
    ...surveyQuestions.map((question) => answerToCsvValue(response, question.id)),
    Object.entries(response.otherAnswers)
      .map(([questionId, text]) => {
        const title = surveyQuestions.find((question) => question.id === questionId)?.title ?? questionId;
        return `${title}: ${text}`;
      })
      .join("; "),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `thaipass-survey-results-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export const downloadResponsesCsv = exportToCSV;
