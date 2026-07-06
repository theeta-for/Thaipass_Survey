import type { SurveyResponse } from "../types";

const STORAGE_KEY = "thaipass-survey-responses";

export function getResponses(): SurveyResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SurveyResponse[]) : [];
  } catch {
    return [];
  }
}

export function saveResponse(response: SurveyResponse) {
  const responses = getResponses();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([response, ...responses]));
  window.dispatchEvent(new Event("thaipass-survey-updated"));
}

export function clearResponses() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("thaipass-survey-updated"));
}
