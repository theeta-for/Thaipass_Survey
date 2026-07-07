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

export type SentimentSummary = {
  positive: number;
  neutral: number;
  negative: number;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
};

function percentage(count: number, total: number) {
  return total ? Math.round((count / total) * 100) : 0;
}

export function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function formatTime(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoDate));
}

export function formatDateTime(isoDate: string) {
  return `${formatDate(isoDate)}, ${formatTime(isoDate)}`;
}

export function calculateSingleChoicePercentages(question: Question, responses: SurveyResponse[]) {
  if (question.type !== "single") {
    return [];
  }

  return question.options.map<OptionSummary>((option) => {
    const count = responses.reduce((total, response) => {
      const answer = response.answers[question.id];
      return total + (answer === option ? 1 : 0);
    }, 0);

    return {
      option,
      count,
      percentage: percentage(count, responses.length),
    };
  });
}

export function calculateMultipleChoicePercentages(question: Question, responses: SurveyResponse[]) {
  if (question.type !== "multiple") {
    return [];
  }

  return question.options.map<OptionSummary>((option) => {
    const count = responses.reduce((total, response) => {
      const answer = response.answers[question.id];
      return total + (Array.isArray(answer) && answer.includes(option) ? 1 : 0);
    }, 0);

    return {
      option,
      count,
      percentage: percentage(count, responses.length),
    };
  });
}

export function calculateScalePercentages(question: Question, responses: SurveyResponse[]) {
  if (question.type !== "scale") {
    return [];
  }

  return [1, 2, 3, 4, 5].map<OptionSummary>((rating) => {
    const count = responses.reduce((total, response) => {
      const answer = response.answers[question.id];
      return total + (answer === rating ? 1 : 0);
    }, 0);

    return {
      option: `${rating}/5`,
      count,
      percentage: percentage(count, responses.length),
    };
  });
}

export function summarizeChoiceQuestion(question: Question, responses: SurveyResponse[]) {
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

export function calculatePositiveNeutralNegativeSummary(
  questionId: string,
  responses: SurveyResponse[],
  positiveOptions: string[],
  neutralOptions: string[],
  negativeOptions: string[],
): SentimentSummary {
  const counts = responses.reduce(
    (totals, response) => {
      const answer = response.answers[questionId];
      if (typeof answer !== "string") {
        return totals;
      }

      if (positiveOptions.includes(answer)) {
        totals.positive += 1;
      } else if (neutralOptions.includes(answer)) {
        totals.neutral += 1;
      } else if (negativeOptions.includes(answer)) {
        totals.negative += 1;
      }
      return totals;
    },
    { positive: 0, neutral: 0, negative: 0 },
  );

  return {
    ...counts,
    positivePercentage: percentage(counts.positive, responses.length),
    neutralPercentage: percentage(counts.neutral, responses.length),
    negativePercentage: percentage(counts.negative, responses.length),
  };
}

export function getMostCommonAnswer(responses: SurveyResponse[], questionId: string) {
  const counts = responses.reduce<Record<string, number>>((totals, response) => {
    const answer = response.answers[questionId];
    if (typeof answer === "string" && answer) {
      totals[answer] = (totals[answer] ?? 0) + 1;
    }
    return totals;
  }, {});

  const [answer, count] = Object.entries(counts).sort(([, firstCount], [, secondCount]) => secondCount - firstCount)[0] ?? [];
  return answer ? { answer, count } : undefined;
}

export function calculateAnswerShare(responses: SurveyResponse[], questionId: string, options: string[]) {
  const count = responses.reduce((total, response) => {
    const answer = response.answers[questionId];
    return total + (typeof answer === "string" && options.includes(answer) ? 1 : 0);
  }, 0);

  return {
    count,
    percentage: percentage(count, responses.length),
  };
}

export function calculateMultipleAnswerShare(responses: SurveyResponse[], questionId: string, option: string) {
  const count = responses.reduce((total, response) => {
    const answer = response.answers[questionId];
    return total + (Array.isArray(answer) && answer.includes(option) ? 1 : 0);
  }, 0);

  return {
    count,
    percentage: percentage(count, responses.length),
  };
}

export function calculateScaleShare(responses: SurveyResponse[], questionId: string, minimumScore: number) {
  const count = responses.reduce((total, response) => {
    const answer = response.answers[questionId];
    return total + (typeof answer === "number" && answer >= minimumScore ? 1 : 0);
  }, 0);

  return {
    count,
    percentage: percentage(count, responses.length),
  };
}

export function calculateAverageNumericScore(responses: SurveyResponse[], questionId: string) {
  const scores = responses
    .map((response) => response.answers[questionId])
    .filter((answer): answer is number => typeof answer === "number");

  if (!scores.length) {
    return undefined;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Number((total / scores.length).toFixed(1));
}

export function calculateAverageScore(responses: SurveyResponse[], questionId: string, scoreMap: Record<string, number>) {
  const scores = responses
    .map((response) => response.answers[questionId])
    .filter((answer): answer is string => typeof answer === "string" && scoreMap[answer] !== undefined)
    .map((answer) => scoreMap[answer]);

  if (!scores.length) {
    return undefined;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return Number((total / scores.length).toFixed(1));
}

export function questionTitle(questionId: string) {
  return surveyQuestions.find((question) => question.id === questionId)?.title ?? questionId;
}
