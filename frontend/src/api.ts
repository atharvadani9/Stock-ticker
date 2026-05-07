import axios, { AxiosError } from "axios";
import type { PollResponse, TableState } from "./types";

// axios conventions:
//   axios.get<T>(url)         → generic T types the response body
//   axios.put<T>(url, data)   → generic T types the response body; data is the request body
//   axios.post<T>(url, data)  → generic T types the response body; data is the request body
// In all cases, response.data is typed as T.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function apiError(err: unknown): never {
  if (err instanceof AxiosError) {
    throw new Error(err.response?.data?.error ?? err.message);
  }
  throw err;
}

export async function fetchTableApi(): Promise<TableState> {
  return axios
    .get<TableState>(`${BASE_URL}/table`)
    .then((r) => r.data)
    .catch(apiError);
}

export async function saveTableApi(state: TableState): Promise<TableState> {
  return axios
    .put<TableState>(`${BASE_URL}/table`, state)
    .then((r) => r.data)
    .catch(apiError);
}

export async function submitLlmApi(
  prompt: string,
): Promise<{ task_id: string }> {
  return axios
    .post<{ task_id: string }>(`${BASE_URL}/llm/async`, { prompt })
    .then((r) => r.data)
    .catch(apiError);
}

export async function pollTaskApi(taskId: string): Promise<PollResponse> {
  return axios
    .get<PollResponse>(`${BASE_URL}/llm/async/poll/${taskId}`)
    .then((r) => r.data)
    .catch(apiError);
}
