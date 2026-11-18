import { createContext, useContext } from 'react'
import type { AppState } from './types'
import type { Actions } from './store'

export type Ctx = { state: AppState; actions: Actions }
export const StoreCtx = createContext<Ctx | null>(null)

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore outside provider')
  return c
}
