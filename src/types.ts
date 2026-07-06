export type QuestionType = "single" | "multiple" | "rating";

export type SingleChoiceQuestion = {
  id: string;
  type: "single";
  title: string;
  options: string[];
};

export type MultipleChoiceQuestion = {
  id: string;
  type: "multiple";
  title: string;
  instruction?: string;
  maxSelections?: number;
  options: string[];
  allowOther?: boolean;
};

export type RatingMatrixQuestion = {
  id: string;
  type: "rating";
  title: string;
  scaleMinLabel: string;
  scaleMaxLabel: string;
  items: string[];
};

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | RatingMatrixQuestion;

export type SurveyAnswers = Record<string, string | string[] | Record<string, number>>;

export type OtherAnswers = Record<string, string>;

export type SurveyResponse = {
  id: string;
  timestamp: string;
  answers: SurveyAnswers;
  otherAnswers: OtherAnswers;
};
