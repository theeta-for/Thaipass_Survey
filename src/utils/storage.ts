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

function updateResponses(responses: SurveyResponse[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  window.dispatchEvent(new Event("thaipass-survey-updated"));
}

export function softDeleteResponse(responseId: string) {
  updateResponses(
    getResponses().map((response) =>
      response.id === responseId ? { ...response, deletedAt: new Date().toISOString() } : response,
    ),
  );
}

export function restoreResponse(responseId: string) {
  updateResponses(
    getResponses().map((response) => {
      if (response.id !== responseId) {
        return response;
      }

      const { deletedAt, ...restoredResponse } = response;
      return restoredResponse;
    }),
  );
}
