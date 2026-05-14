import { AsyncLocalStorage } from 'async_hooks'

export interface RLSContext {
  userId: string
  role: string
}

export const rlsStore = new AsyncLocalStorage<RLSContext>()
