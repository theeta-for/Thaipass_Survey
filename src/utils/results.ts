import { surveyQuestions } from "../data/surveyQuestions";
import type { Question, SurveyResponse } from "../types";

export type OptionSummary = {
  option: string;
  count: number;
  percentage: number;
};

export type RatingSummary = {
  item: string;
  average: number;
  count: number;
};

export function summarizeChoiceQuestion(question: Question, responses: SurveyResponse[]) {
  if (question.type === "rating") {
    return [];
  }

  return question.options.map<OptionSummary>((option) => {
    const count = responses.reduce((total, response) => {
      const answer = response.answers[question.id];
      if (Array.isArray(answer)) {
        return total + (answer.includes(option) ? 1 : 0);
      }
      return total + (answer === option ? 1 : 0);
    }, 0);

    return {
      option,
      count,
      percentage: responses.length ? Math.round((count / responses.length) * 100) : 0,
    };
  });
}

export function summarizeRatingQuestion(question: Question, responses: SurveyResponse[]) {
  if (question.type !== "rating") {
    return [];
  }

  return question.items.map<RatingSummary>((item) => {
    const values = responses
      .map((response) => response.answers[question.id])
      .filter((answer): answer is Record<string, number> => Boolean(answer) && typeof answer === "object" && !Array.isArray(answer))
      .map((answer) => answer[item])
      .filter((rating): rating is number => typeof rating === "number");

    const total = values.reduce((sum, value) => sum + value, 0);

    return {
      item,
      average: values.length ? Number((total / values.length).toFixed(1)) : 0,
      count: values.length,
    };
  });
}

export function questionTitle(questionId: string) {
  return surveyQuestions.find((question) => question.id === questionId)?.title ?? questionId;
}
