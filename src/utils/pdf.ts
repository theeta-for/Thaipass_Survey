import { surveyQuestions } from "../data/surveyQuestions";
import type { Question, SurveyResponse } from "../types";
import { formatDate, formatTime } from "./results";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function answerToText(response: SurveyResponse, question: Question) {
  const answer = response.answers[question.id];
  if (Array.isArray(answer)) {
    return answer.join(", ");
  }
  if (typeof answer === "number") {
    return `${answer}/5`;
  }
  if (answer && typeof answer === "object") {
    return Object.entries(answer)
      .map(([item, rating]) => {
        const label = question.type === "rating" ? question.items.find((ratingItem) => ratingItem.id === item)?.label : undefined;
        return `${label ?? item}: ${rating}`;
      })
      .join(", ");
  }
  return String(answer ?? "-");
}

function otherText(response: SurveyResponse) {
  const text = Object.entries(response.otherAnswers)
    .filter(([, value]) => value.trim())
    .map(([questionId, value]) => {
      const question = surveyQuestions.find((item) => item.id === questionId);
      return `${question?.title ?? questionId}: ${value}`;
    })
    .join("; ");

  return text || "-";
}

export function exportToPDF(responses: SurveyResponse[]) {
  const printable = window.open("", "_blank", "noopener,noreferrer");
  if (!printable) {
    window.alert("Please allow pop-ups to export the PDF.");
    return;
  }

  const questionHeaders = surveyQuestions.map((question) => `<th>${escapeHtml(question.title)}</th>`).join("");
  const rows = responses
    .map(
      (response) => `
        <tr>
          <td>${escapeHtml(response.timestamp)}</td>
          <td>${escapeHtml(formatDate(response.timestamp))}</td>
          <td>${escapeHtml(formatTime(response.timestamp))}</td>
          ${surveyQuestions.map((question) => `<td>${escapeHtml(answerToText(response, question))}</td>`).join("")}
          <td>${escapeHtml(otherText(response))}</td>
        </tr>
      `,
    )
    .join("");

  printable.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>ThaiPass Survey Results</title>
        <style>
          body { color: #17181c; font-family: Arial, sans-serif; margin: 24px; }
          h1 { color: #d71920; margin: 0; }
          p { color: #5d6370; margin: 6px 0 18px; }
          table { border-collapse: collapse; width: 100%; font-size: 10px; }
          th, td { border: 1px solid #e6e8ed; padding: 6px; text-align: left; vertical-align: top; }
          th { background: #f5f6f8; }
          @media print {
            @page { size: landscape; margin: 12mm; }
          }
        </style>
      </head>
      <body>
        <h1>ThaiPass Survey Results</h1>
        <p>Concept Validation Survey · ${responses.length} active responses · Exported ${escapeHtml(new Date().toLocaleString())}</p>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Date</th>
              <th>Time</th>
              ${questionHeaders}
              <th>Other text answers</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printable.document.close();
}
