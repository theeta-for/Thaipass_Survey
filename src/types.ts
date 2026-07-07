export type QuestionType = "single" | "multiple" | "rating" | "scale" | "text";

export type OptionGroup = {
  label: string;
  options: string[];
};

type QuestionBase = {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  showConceptMockup?: boolean;
};

export type SingleChoiceQuestion = QuestionBase & {
  type: "single";
  display?: "radio" | "select";
  fieldLabel?: string;
  placeholder?: string;
  options: string[];
  optionGroups?: OptionGroup[];
  allowOther?: boolean;
};

export type MultipleChoiceQuestion = QuestionBase & {
  type: "multiple";
  instruction?: string;
  maxSelections?: number;
  options: string[];
  allowOther?: boolean;
};

export type RatingMatrixQuestion = QuestionBase & {
  type: "rating";
  scaleMinLabel: string;
  scaleMaxLabel: string;
  items: string[];
};

export type RatingScaleQuestion = QuestionBase & {
  type: "scale";
  scaleMinLabel: string;
  scaleMaxLabel: string;
};

export type TextQuestion = QuestionBase & {
  type: "text";
  placeholder?: string;
};

export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | RatingMatrixQuestion
  | RatingScaleQuestion
  | TextQuestion;

export type SurveyAnswers = Record<string, string | string[] | number | Record<string, number>>;

export type OtherAnswers = Record<string, string>;

export type SurveyResponse = {
  id: string;
  timestamp: string;
  deletedAt?: string;
  answers: SurveyAnswers;
  otherAnswers: OtherAnswers;
};
