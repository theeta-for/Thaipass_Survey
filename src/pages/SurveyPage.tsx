import { FormEvent, useMemo, useState } from "react";
import { MultipleChoiceQuestion } from "../components/MultipleChoiceQuestion";
import { QuestionCard } from "../components/QuestionCard";
import { RatingMatrixQuestion } from "../components/RatingMatrixQuestion";
import { RatingScaleQuestion } from "../components/RatingScaleQuestion";
import { SelectQuestion } from "../components/SelectQuestion";
import { SingleChoiceQuestion } from "../components/SingleChoiceQuestion";
import { SurveyLayout } from "../components/SurveyLayout";
import { TextQuestion } from "../components/TextQuestion";
import { surveyQuestions } from "../data/surveyQuestions";
import { useLanguage } from "../utils/language";
import { saveResponse } from "../utils/storage";
import type { OtherAnswers, SurveyAnswers, SurveyResponse } from "../types";

type ValidationErrors = Record<string, string>;

function isQuestionAnswered(questionId: string, answers: SurveyAnswers) {
  const question = surveyQuestions.find((item) => item.id === questionId);
  if (question?.required === false) {
    return true;
  }

  return hasAnswer(questionId, answers);
}

function hasAnswer(questionId: string, answers: SurveyAnswers) {
  const question = surveyQuestions.find((item) => item.id === questionId);

  const answer = answers[questionId];
  if (Array.isArray(answer)) {
    return answer.length > 0;
  }
  if (typeof answer === "number") {
    return answer >= 1 && answer <= 5;
  }
  if (answer && typeof answer === "object") {
    return question?.type === "rating" && question.items.every((item) => answer[item]);
  }
  return typeof answer === "string" ? answer.trim().length > 0 : Boolean(answer);
}

function validateAnswers(answers: SurveyAnswers): ValidationErrors {
  return surveyQuestions.reduce<ValidationErrors>((errors, question) => {
    if (!isQuestionAnswered(question.id, answers)) {
      errors[question.id] =
        question.type === "rating"
          ? "Please rate every topic before submitting."
          : "Please select an answer before continuing.";
    }
    return errors;
  }, {});
}

function questionErrorMessage(questionId: string) {
  const question = surveyQuestions.find((item) => item.id === questionId);
  return question?.type === "rating"
    ? "Please rate every topic before continuing."
    : "Please select an answer before continuing.";
}

export function SurveyPage() {
  const { language, setLanguage, t } = useLanguage();
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [otherAnswers, setOtherAnswers] = useState<OtherAnswers>({});
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [attemptedQuestions, setAttemptedQuestions] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const answeredCount = useMemo(
    () => surveyQuestions.filter((question) => hasAnswer(question.id, answers)).length,
    [answers],
  );
  const currentQuestion = surveyQuestions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === surveyQuestions.length - 1;
  const currentQuestionAnswered = isQuestionAnswered(currentQuestion.id, answers);

  function updateAnswer(questionId: string, value: SurveyAnswers[string]) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setSubmitError("");
    setAttemptedQuestions((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
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
    const targetQuestion = surveyQuestions[index];
    setErrors({});
    if (targetQuestion) {
      setAttemptedQuestions((current) => {
        const next = { ...current };
        delete next[targetQuestion.id];
        return next;
      });
    }
    setCurrentQuestionIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    if (!currentQuestionAnswered) {
      setAttemptedQuestions((current) => ({ ...current, [currentQuestion.id]: true }));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    const validationErrors = validateAnswers(answers);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidIndex = surveyQuestions.findIndex((question) => validationErrors[question.id]);
      if (firstInvalidIndex >= 0) {
        setAttemptedQuestions((current) => ({
          ...current,
          [surveyQuestions[firstInvalidIndex].id]: true,
        }));
        setCurrentQuestionIndex(firstInvalidIndex);
      }
      return;
    }

    setIsSubmitting(true);
    const response: SurveyResponse = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      answers,
      otherAnswers,
    };

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      await saveResponse(response);
      setIsSubmitting(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setIsSubmitting(false);
      setSubmitError("We could not submit your response. Please try again.");
    }
  }

  if (submitted) {
    return (
      <SurveyLayout
        eyebrow="Research survey"
        title="Thank you for your feedback."
        description="Your response has been submitted successfully."
        language={language}
        onLanguageChange={setLanguage}
        actions={<a className="secondary-button" href="/results">{t("View results")}</a>}
      >
        <section className="thank-you-card">
          <h2>{t("Your response has been submitted successfully.")}</h2>
          <p>
            {t("Your answers will help us understand whether ThaiPass is useful before the final product is designed.")}
          </p>
          <a className="primary-button" href="/survey">{t("Submit another response")}</a>
        </section>
      </SurveyLayout>
    );
  }

  return (
    <SurveyLayout
      eyebrow="Concept validation"
      title="ThaiPass Survey"
      description="Help us validate ThaiPass, a Thailand Travel Assistant concept for international travelers. This survey takes around 2-3 minutes and does not require personal data."
      language={language}
      onLanguageChange={setLanguage}
    >
      <form className="survey-form" onSubmit={handleSubmit} noValidate>
        <section className="progress-card" aria-label={`Survey progress ${Math.round(((currentQuestionIndex + 1) / surveyQuestions.length) * 100)}%`}>
          <div className="progress-copy">
            <span>{t("Step")} {currentQuestionIndex + 1} {t("of")} {surveyQuestions.length}</span>
            <strong>
              {answeredCount} {t("of")} {surveyQuestions.length} {t("answered")}
            </strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${Math.round(((currentQuestionIndex + 1) / surveyQuestions.length) * 100)}%` }} />
          </div>
          <div className="question-tabs" aria-label="Survey questions">
            {surveyQuestions.map((question, index) => {
              const isActive = index === currentQuestionIndex;
              const isAnswered = hasAnswer(question.id, answers);

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
        </section>

        <QuestionCard
          key={currentQuestion.id}
          number={currentQuestionIndex + 1}
          title={t(currentQuestion.title)}
          description={currentQuestion.description ? t(currentQuestion.description) : undefined}
          instruction={currentQuestion.type === "multiple" ? t(currentQuestion.instruction) : undefined}
          error={errors[currentQuestion.id] && attemptedQuestions[currentQuestion.id] ? t(errors[currentQuestion.id]) : undefined}
          showConceptMockup={currentQuestion.showConceptMockup}
        >
          {currentQuestion.type === "single" ? (
            <>
              {currentQuestion.display === "select" ? (
                <SelectQuestion
                  name={currentQuestion.id}
                  options={currentQuestion.options}
                  optionGroups={currentQuestion.optionGroups}
                  label={currentQuestion.fieldLabel ? t(currentQuestion.fieldLabel) : undefined}
                  placeholder={currentQuestion.placeholder ? t(currentQuestion.placeholder) : undefined}
                  value={answers[currentQuestion.id] as string | undefined}
                  getOptionLabel={t}
                  getGroupLabel={t}
                  onChange={(value) => updateAnswer(currentQuestion.id, value)}
                />
              ) : (
                <SingleChoiceQuestion
                  name={currentQuestion.id}
                  options={currentQuestion.options}
                  value={answers[currentQuestion.id] as string | undefined}
                  getOptionLabel={t}
                  onChange={(value) => updateAnswer(currentQuestion.id, value)}
                />
              )}
              {currentQuestion.allowOther && answers[currentQuestion.id] === "Other" ? (
                <label className="other-field">
                  <span>{t("Please tell us more")}</span>
                  <input
                    type="text"
                    value={otherAnswers[currentQuestion.id] ?? ""}
                    onChange={(event) => updateOtherAnswer(currentQuestion.id, event.target.value)}
                    placeholder={t("Type your answer")}
                  />
                </label>
              ) : null}
            </>
          ) : null}

          {currentQuestion.type === "multiple" ? (
            <MultipleChoiceQuestion
              name={currentQuestion.id}
              options={currentQuestion.options}
              value={(answers[currentQuestion.id] as string[] | undefined) ?? []}
              maxSelections={currentQuestion.maxSelections}
              otherValue={otherAnswers[currentQuestion.id]}
              getOptionLabel={t}
              otherLabel={t("Please tell us more")}
              otherPlaceholder={t("Type your answer")}
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
              scaleOptions={currentQuestion.scaleOptions}
              itemGroups={currentQuestion.itemGroups}
              getLabel={t}
              value={(answers[currentQuestion.id] as Record<string, string | number> | undefined) ?? {}}
              onChange={(item, rating) => {
                const current = (answers[currentQuestion.id] as Record<string, string | number> | undefined) ?? {};
                updateAnswer(currentQuestion.id, { ...current, [item]: rating });
              }}
            />
          ) : null}

          {currentQuestion.type === "scale" ? (
            <RatingScaleQuestion
              name={currentQuestion.id}
              minLabel={currentQuestion.scaleMinLabel}
              maxLabel={currentQuestion.scaleMaxLabel}
              value={answers[currentQuestion.id] as number | undefined}
              onChange={(value) => updateAnswer(currentQuestion.id, value)}
            />
          ) : null}

          {currentQuestion.type === "text" ? (
            <TextQuestion
              name={currentQuestion.id}
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id] as string | undefined}
              onChange={(value) => updateAnswer(currentQuestion.id, value)}
            />
          ) : null}
        </QuestionCard>

        <div className="step-panel step-panel-actions-only">
          {submitError ? <p className="field-error">{t(submitError)}</p> : null}
          <div className="step-actions">
            <button className="ghost-button" type="button" onClick={handleBack} disabled={isFirstQuestion}>
              {t("Back")}
            </button>
            {isLastQuestion ? (
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("Submitting your response...") : t("Submit response")}
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={handleNext}>
                {t("Continue")}
              </button>
            )}
          </div>
        </div>
      </form>
    </SurveyLayout>
  );
}
