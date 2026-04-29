import axios, { AxiosError } from "axios"
import type { TableState, PollResponse } from "./types"

function apiError(err: unknown): never {
  if (err instanceof AxiosError) {
    throw new Error(err.response?.data?.error ?? err.message)
  }
  throw err
}

export async function fetchTable(): Promise<TableState> {
  return axios.get<TableState>("/table").then(r => r.data).catch(apiError)
}

export async function saveTable(state: TableState): Promise<TableState> {
  return axios.put<TableState>("/table", state).then(r => r.data).catch(apiError)
}

export async function submitLLM(prompt: string): Promise<{ task_id: string }> {
  return axios.post<{ task_id: string }>("/llm/async", { prompt }).then(r => r.data).catch(apiError)
}

export async function pollTask(taskId: string): Promise<PollResponse> {
  return axios.get<PollResponse>(`/llm/async/poll/${taskId}`).then(r => r.data).catch(apiError)
}
