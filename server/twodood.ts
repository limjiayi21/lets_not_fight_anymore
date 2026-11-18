// Dev/preview-server bridge from the web app to the MeloMed 2DooD MCP server.
// The browser can't speak MCP over stdio, so Vite spawns `2dood-mcp` and exposes
// a tiny JSON API under /api/2dood:
//   GET  /api/2dood/status    -> { ok, demo, server }
//   GET  /api/2dood/tasks     -> { ok, tasks: [{ id, title, done, due }] }
//   POST /api/2dood/add       { tasks: string[], notes?, due? } -> { ok, ids, text }
//   POST /api/2dood/complete  { ids: string[] } -> { ok, text }
// Demo mode (default) uses 2DooD's built-in fictional data: no account, no network.
// Set TWODOOD_LIVE=1 to use the account you signed into with `npx -y 2dood-mcp login`.

import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const DEMO = process.env.TWODOOD_LIVE !== '1'

let clientPromise: Promise<Client> | null = null

function connect(root: string): Promise<Client> {
  if (clientPromise) return clientPromise
  const local = path.join(root, 'node_modules', '2dood-mcp', 'dist', 'index.js')
  const args = DEMO ? ['--demo'] : []
  const transport = fs.existsSync(local)
    ? new StdioClientTransport({ command: process.execPath, args: [local, ...args], stderr: 'pipe' })
    : new StdioClientTransport({ command: 'npx', args: ['-y', '2dood-mcp', ...args], stderr: 'pipe' })
  const client = new Client({ name: 'lets-not-fight', version: '1.0.0' })
  client.onclose = () => {
    clientPromise = null
  }
  clientPromise = client.connect(transport).then(
    () => client,
    (err) => {
      clientPromise = null
      throw err
    },
  )
  return clientPromise
}

async function callTool(root: string, name: string, args: Record<string, unknown>): Promise<string> {
  const client = await connect(root)
  const res = (await client.callTool({ name, arguments: args })) as { content?: { type: string; text?: string }[]; isError?: boolean }
  const text = (res.content ?? []).map((c) => (c.type === 'text' ? c.text ?? '' : '')).join('\n')
  if (res.isError) throw new Error(text || `${name} failed`)
  return text
}

// 2dood-mcp formats tasks as: "- [ ] Title · due Mon, Nov 17, 7:45 PM · from mcp  (id: abc-123)"
function parseTasks(text: string) {
  const tasks: { id: string; title: string; done: boolean; due: string | null }[] = []
  for (const line of text.split('\n')) {
    const m = line.match(/^- \[( |x)\] (.*)\s+\(id: ([^)]+)\)\s*$/)
    if (!m) continue
    const parts = m[2].trim().split(' · ')
    const due = parts.find((p) => p.startsWith('due '))?.slice(4) ?? null
    tasks.push({ id: m[3], title: parts[0], done: m[1] === 'x', due })
  }
  return tasks
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function handler(root: string) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = (req.url ?? '').split('?')[0]
    try {
      if (req.method === 'GET' && url === '/status') {
        const client = await connect(root)
        return send(res, 200, { ok: true, demo: DEMO, server: client.getServerVersion()?.name ?? '2DooD' })
      }
      if (req.method === 'GET' && url === '/tasks') {
        const text = await callTool(root, 'list_tasks', { view: 'open', limit: 50 })
        return send(res, 200, { ok: true, demo: DEMO, tasks: parseTasks(text) })
      }
      if (req.method === 'POST' && url === '/add') {
        const body = await readBody(req)
        const tasks = (Array.isArray(body.tasks) ? body.tasks : []).map(String).filter(Boolean)
        if (!tasks.length) return send(res, 400, { ok: false, error: 'No tasks given' })
        const text = await callTool(root, 'add_tasks', {
          text: tasks.join('\n'),
          parse_dates: false,
          ...(body.due ? { due: String(body.due) } : {}),
          ...(body.notes ? { notes: String(body.notes) } : {}),
        })
        return send(res, 200, { ok: true, ids: parseTasks(text).map((t) => t.id), text })
      }
      if (req.method === 'POST' && url === '/complete') {
        const body = await readBody(req)
        const ids = (Array.isArray(body.ids) ? body.ids : []).map(String).filter(Boolean)
        if (!ids.length) return send(res, 400, { ok: false, error: 'No ids given' })
        const text = await callTool(root, 'complete_task', { ids, done: true })
        return send(res, 200, { ok: true, text })
      }
      next()
    } catch (err) {
      send(res, 502, { ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  }
}

export function twoDooD(): Plugin {
  return {
    name: 'lets-not-fight-2dood',
    configureServer(server) {
      server.middlewares.use('/api/2dood', handler(server.config.root))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/2dood', handler(server.config.root))
    },
  }
}
