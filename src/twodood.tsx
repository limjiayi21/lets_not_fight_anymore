// Browser side of the MeloMed 2DooD integration. Talks to the Vite bridge in
// server/twodood.ts, which runs the real `2dood-mcp` MCP server.
import { useCallback, useEffect, useState } from 'react'
import { ListChecks } from 'lucide-react'
import { studentById } from './data'
import { useStore } from './store'
import type { Issue } from './types'

export type TodoTask = { id: string; title: string; done: boolean; due: string | null }

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/2dood${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }))
  if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data as T
}

export const twoDooD = {
  status: () => api<{ demo: boolean; server: string }>('/status'),
  tasks: () => api<{ demo: boolean; tasks: TodoTask[] }>('/tasks'),
  add: (tasks: string[], notes: string, due: string) => api<{ ids: string[] }>('/add', { tasks, notes, due }),
  complete: (ids: string[]) => api<{ text: string }>('/complete', { ids }),
}

// Guards against double calls (React StrictMode runs effects twice in dev).
const inFlight = new Set<string>()

/** Watches issues and mirrors them into 2DooD: add on nudge, complete on "Cleaned it". */
export function TwoDooDSync() {
  const { state, actions } = useStore()

  useEffect(() => {
    for (const issue of state.issues) {
      if (!issue.synced) continue
      const st = studentById(issue.studentId)

      if (!issue.sync && !inFlight.has('add:' + issue.id)) {
        inFlight.add('add:' + issue.id)
        actions.dispatch({ type: 'syncUpdate', issueId: issue.id, sync: { status: 'pending' } })
        const titles = issue.todoTitles?.length ? issue.todoTitles : [`Clean: ${issue.summary}`]
        const due = new Date(issue.createdAt + 30 * 60000).toISOString()
        twoDooD
          .add(titles, `From Let's Not Fight: a private kitchen nudge for ${st.name}. Clear it within 30 min 🙂`, due)
          .then(({ ids }) =>
            actions.dispatch({
              type: 'syncUpdate',
              issueId: issue.id,
              sync: { status: 'synced', taskIds: ids },
              log: `Added ${titles.map((t) => `“${t}”`).join(' and ')} to ${st.name}'s 2DooD list (via 2DooD MCP)`,
            }),
          )
          .catch((e: Error) =>
            actions.dispatch({
              type: 'syncUpdate',
              issueId: issue.id,
              sync: { status: 'error', error: e.message },
              log: `Couldn't reach 2DooD (${e.message}). The nudge still went out.`,
            }),
          )
      }

      if (issue.resolvedAt && issue.sync?.status === 'synced' && issue.sync.taskIds?.length && !issue.sync.completed && !inFlight.has('done:' + issue.id)) {
        inFlight.add('done:' + issue.id)
        twoDooD
          .complete(issue.sync.taskIds)
          .then(() =>
            actions.dispatch({
              type: 'syncUpdate',
              issueId: issue.id,
              sync: { completed: true },
              log: `Ticked off ${issue.sync!.taskIds!.length} to-do${issue.sync!.taskIds!.length > 1 ? 's' : ''} in ${st.name}'s 2DooD`,
            }),
          )
          .catch(() => inFlight.delete('done:' + issue.id))
      }
    }
  }, [state.issues, actions])

  return null
}

export function SyncBadge({ issue }: { issue: Issue }) {
  if (!issue.synced) return null
  const s = issue.sync
  const label =
    s?.status === 'error'
      ? '2DooD offline'
      : s?.status === 'synced'
        ? s.completed
          ? 'Done in 2DooD'
          : `Added to 2DooD${s.taskIds?.length ? ` · ${s.taskIds.length} to-do${s.taskIds.length > 1 ? 's' : ''}` : ''}`
        : 'Syncing to 2DooD…'
  const tone = s?.status === 'error' ? 'bg-ink/5 text-muted' : 'bg-lilac-soft text-lilac'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${tone}`} title={s?.error}>
      <ListChecks size={11} /> {label}
    </span>
  )
}

/** Live list from the 2DooD MCP server; refreshes when issues change. */
export function useTwoDooDTasks(refreshKey: unknown) {
  const [tasks, setTasks] = useState<TodoTask[] | null>(null)
  const [demo, setDemo] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    twoDooD
      .tasks()
      .then((r) => {
        setTasks(r.tasks)
        setDemo(r.demo)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
  }, [])
  useEffect(() => {
    load()
    const t = setTimeout(load, 1200) // pick up adds that finish just after a change
    return () => clearTimeout(t)
  }, [load, refreshKey])
  return { tasks, demo, error, reload: load }
}
