import type { SurveyResponse } from "../types";

const STORAGE_KEY = "thaipass-survey-responses";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const SUPABASE_TABLE = "survey_responses";

type SurveyResponseRow = {
  id: string;
  timestamp: string;
  deleted_at: string | null;
  answers: SurveyResponse["answers"];
  other_answers: SurveyResponse["otherAnswers"];
};

function hasSharedStorage() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function rowToResponse(row: SurveyResponseRow): SurveyResponse {
  return {
    id: row.id,
    timestamp: row.timestamp,
    deletedAt: row.deleted_at ?? undefined,
    answers: row.answers,
    otherAnswers: row.other_answers ?? {},
  };
}

function responseToRow(response: SurveyResponse) {
  return {
    id: response.id,
    timestamp: response.timestamp,
    deleted_at: response.deletedAt ?? null,
    answers: response.answers,
    other_answers: response.otherAnswers,
  };
}

async function requestSharedStorage<T>(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Shared storage is not configured.");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Shared storage request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getResponses(): SurveyResponse[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SurveyResponse[]) : [];
  } catch {
    return [];
  }
}

function updateLocalResponses(responses: SurveyResponse[], shouldNotify = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
  if (shouldNotify) {
    window.dispatchEvent(new Event("thaipass-survey-updated"));
  }
}

export async function loadResponses(): Promise<SurveyResponse[]> {
  if (!hasSharedStorage()) {
    return getResponses();
  }

  const rows = await requestSharedStorage<SurveyResponseRow[]>(
    `${SUPABASE_TABLE}?select=*&order=timestamp.desc`,
  );
  const responses = rows.map(rowToResponse);
  updateLocalResponses(responses, false);
  return responses;
}

export async function saveResponse(response: SurveyResponse) {
  if (hasSharedStorage()) {
    await requestSharedStorage<SurveyResponseRow[]>(SUPABASE_TABLE, {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(responseToRow(response)),
    });
  }

  const responses = getResponses().filter((item) => item.id !== response.id);
  updateLocalResponses([response, ...responses]);
}

async function updateSharedResponse(responseId: string, data: Partial<SurveyResponseRow>) {
  await requestSharedStorage<SurveyResponseRow[]>(`${SUPABASE_TABLE}?id=eq.${responseId}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });
}

function updateResponses(updater: (responses: SurveyResponse[]) => SurveyResponse[]) {
  const responses = updater(getResponses());
  updateLocalResponses(responses);
}

export async function softDeleteResponse(responseId: string) {
  const deletedAt = new Date().toISOString();

  if (hasSharedStorage()) {
    await updateSharedResponse(responseId, { deleted_at: deletedAt });
  }

  updateResponses((responses) =>
    responses.map((response) =>
      response.id === responseId ? { ...response, deletedAt } : response,
    ),
  );
}

export async function restoreResponse(responseId: string) {
  if (hasSharedStorage()) {
    await updateSharedResponse(responseId, { deleted_at: null });
  }

  updateResponses((responses) =>
    responses.map((response) => {
      if (response.id !== responseId) {
        return response;
      }

      const { deletedAt, ...restoredResponse } = response;
      return restoredResponse;
    }),
  );
}

export async function clearResponses() {
  if (hasSharedStorage()) {
    await requestSharedStorage(`${SUPABASE_TABLE}?id=not.is.null`, {
      method: "DELETE",
    });
  }

  updateResponses(() => []);
}
