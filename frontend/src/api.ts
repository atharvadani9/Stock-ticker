import axios, { AxiosError } from "axios"
import type { TableState, PollResponse } from "./types"

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

function apiError(err: unknown): never {
  if (err instanceof AxiosError) {
    throw new Error(err.response?.data?.error ?? err.message)
  }
  throw err
}

export async function fetchTable(): Promise<TableState> {
  return axios.get<TableState>(`${BASE_URL}/table`).then(r => r.data).catch(apiError)
}

export async function saveTable(state: TableState): Promise<TableState> {
  return axios.put<TableState>(`${BASE_URL}/table`, state).then(r => r.data).catch(apiError)
}

export async function submitLLM(prompt: string): Promise<{ task_id: string }> {
  return axios.post<{ task_id: string }>(`${BASE_URL}/llm/async`, { prompt }).then(r => r.data).catch(apiError)
}

export async function pollTask(taskId: string): Promise<PollResponse> {
  return axios.get<PollResponse>(`${BASE_URL}/llm/async/poll/${taskId}`).then(r => r.data).catch(apiError)
}
