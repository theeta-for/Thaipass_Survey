import { FormEvent, useMemo, useState } from "react";
import { MultipleChoiceQuestion } from "../components/MultipleChoiceQuestion";
import { ProgressBar } from "../components/ProgressBar";
import { QuestionCard } from "../components/QuestionCard";
import { RatingMatrixQuestion } from "../components/RatingMatrixQuestion";
import { SingleChoiceQuestion } from "../components/SingleChoiceQuestion";
import { SurveyLayout } from "../components/SurveyLayout";
import { surveyQuestions } from "../data/surveyQuestions";
import { saveResponse } from "../utils/storage";
import type { OtherAnswers, SurveyAnswers, SurveyResponse } from "../types";

type ValidationErrors = Record<string, string>;

function isQuestionAnswered(questionId: string, answers: SurveyAnswers) {
  const answer = answers[questionId];
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }
  if (answer && typeof answer === "object") {
    const question = surveyQuestions.find((item) => item.id === questionId);
    return question?.type === "rating" && question.items.every((item) => answer[item]);
  }
  return Boolean(answer);
}

function validateAnswers(answers: SurveyAnswers): ValidationErrors {
  return surveyQuestions.reduce<ValidationErrors>((errors, question) => {
    if (!isQuestionAnswered(question.id, answers)) {
      errors[question.id] =
        question.type === "rating"
          ? "Please rate every service before submitting."
          : "Please choose at least one answer.";
    }
    return errors;
  }, {});
}

function questionErrorMessage(questionId: string) {
  const question = surveyQuestions.find((item) => item.id === questionId);
  return question?.type === "rating"
    ? "Please rate every service before continuing."
    : "Please choose at least one answer before continuing.";
}

export function SurveyPage() {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [otherAnswers, setOtherAnswers] = useState<OtherAnswers>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const answeredCount = useMemo(
    () => surveyQuestions.filter((question) => isQuestionAnswered(question.id, answers)).length,
    [answers],
  );
  const currentQuestion = surveyQuestions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === surveyQuestions.length - 1;
  const currentQuestionAnswered = isQuestionAnswered(currentQuestion.id, answers);

  function updateAnswer(questionId: string, value: SurveyAnswers[string]) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  }

  function updateOtherAnswer(questionId: string, value: string) {
    setOtherAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function goToQuestion(index: number) {
    setCurrentQuestionIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    if (!currentQuestionAnswered) {
      setErrors((current) => ({
        ...current,
        [currentQuestion.id]: questionErrorMessage(currentQuestion.id),
      }));
      return;
    }

    goToQuestion(Math.min(currentQuestionIndex + 1, surveyQuestions.length - 1));
  }

  function handleBack() {
    goToQuestion(Math.max(currentQuestionIndex - 1, 0));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateAnswers(answers);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidIndex = surveyQuestions.findIndex((question) => validationErrors[question.id]);
      if (firstInvalidIndex >= 0) {
        setCurrentQuestionIndex(firstInvalidIndex);
      }
      return;
    }

    const response: SurveyResponse = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      answers,
      otherAnswers,
    };

    saveResponse(response);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <SurveyLayout
        eyebrow="Research survey"
        title="Thank you for helping ThaiPass improve."
        description="Your answers have been saved. We appreciate your time and your travel perspective."
        actions={<a className="secondary-button" href="/results">View results</a>}
      >
        <section className="thank-you-card">
          <h2>All set</h2>
          <p>
            Your response will help shape a more useful Thailand Trip Assistant for travelers arriving in Thailand.
          </p>
          <a className="primary-button" href="/survey">Submit another response</a>
        </section>
      </SurveyLayout>
    );
  }

  return (
    <SurveyLayout
      eyebrow="ThaiPass user research"
      title="ThaiPass Travel Survey"
      description="Help us improve ThaiPass for travelers visiting Thailand. This survey takes about 3 minutes."
    >
      <form className="survey-form" onSubmit={handleSubmit} noValidate>
        <ProgressBar answered={answeredCount} total={surveyQuestions.length} />

        <div className="question-tabs" aria-label="Survey questions">
          {surveyQuestions.map((question, index) => {
            const isActive = index === currentQuestionIndex;
            const isAnswered = isQuestionAnswered(question.id, answers);

            return (
              <button
                className={`question-tab ${isActive ? "is-active" : ""} ${isAnswered ? "is-complete" : ""}`}
                key={question.id}
                type="button"
                onClick={() => goToQuestion(index)}
                aria-current={isActive ? "step" : undefined}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <QuestionCard
          key={currentQuestion.id}
          number={currentQuestionIndex + 1}
          title={currentQuestion.title}
          instruction={currentQuestion.type === "multiple" ? currentQuestion.instruction : undefined}
          error={errors[currentQuestion.id]}
        >
          {currentQuestion.type === "single" ? (
            <SingleChoiceQuestion
              name={currentQuestion.id}
              options={currentQuestion.options}
              value={answers[currentQuestion.id] as string | undefined}
              onChange={(value) => updateAnswer(currentQuestion.id, value)}
            />
          ) : null}

          {currentQuestion.type === "multiple" ? (
            <MultipleChoiceQuestion
              name={currentQuestion.id}
              options={currentQuestion.options}
              value={(answers[currentQuestion.id] as string[] | undefined) ?? []}
              maxSelections={currentQuestion.maxSelections}
              otherValue={otherAnswers[currentQuestion.id]}
              onChange={(value) => updateAnswer(currentQuestion.id, value)}
              onOtherChange={
                currentQuestion.allowOther ? (value) => updateOtherAnswer(currentQuestion.id, value) : undefined
              }
            />
          ) : null}

          {currentQuestion.type === "rating" ? (
            <RatingMatrixQuestion
              items={currentQuestion.items}
              minLabel={currentQuestion.scaleMinLabel}
              maxLabel={currentQuestion.scaleMaxLabel}
              value={(answers[currentQuestion.id] as Record<string, number> | undefined) ?? {}}
              onChange={(item, rating) => {
                const current = (answers[currentQuestion.id] as Record<string, number> | undefined) ?? {};
                updateAnswer(currentQuestion.id, { ...current, [item]: rating });
              }}
            />
          ) : null}
        </QuestionCard>

        <div className="step-panel">
          <div>
            <h2>
              Question {currentQuestionIndex + 1} of {surveyQuestions.length}
            </h2>
            <p>
              {isLastQuestion
                ? "Review your answer, then submit when you are ready."
                : "Answer this question, then tap Next to continue."}
            </p>
          </div>
          <div className="step-actions">
            <button className="ghost-button" type="button" onClick={handleBack} disabled={isFirstQuestion}>
              Back
            </button>
            {isLastQuestion ? (
              <button className="primary-button" type="submit">
                Submit survey
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={handleNext}>
                Next
              </button>
            )}
          </div>
        </div>
      </form>
    </SurveyLayout>
  );
}
