export type TradeMsg = {
  id?: string
  account?: { id?: string } | string
  trader?: string
  sender?: string
  owner?: string
  from?: string
  to?: string
  isBuy?: boolean
  side?: 'buy' | 'sell'
  amountIn?: number | bigint
  amountOut?: number | bigint
  priceNativePerTokenWad?: number | bigint
  token?: { symbol?: string }
  timestamp?: number
  transaction?: { id?: string }
}

type Listener = (m: TradeMsg) => void

let initialized = false
const listeners = new Set<Listener>()
const sockets = new Map<string, WebSocket>()
const seen = new Map<string, number>()

// ------------ helper functions ------------
const parse = (data: any): any[] => {
  try {
    const d = typeof data === 'string' ? JSON.parse(data) : data
    if (Array.isArray(d)) return d
    if (d?.type === 'trade' && d?.data) return [d.data]
    if (d?.event === 'trade' && d?.payload) return [d.payload]
    if (d?.records && Array.isArray(d.records)) return d.records
    return [d]
  } catch {
    return []
  }
}

const msgKey = (m: any) =>
  String(
    m?.id ??
      m?.txHash ??
      m?.transaction?.id ??
      m?.transactionHash ??
      `${m?.blockNumber ?? ''}:${m?.logIndex ?? ''}:${m?.address ?? ''}`
  )

const emit = (arr: any[]) => {
  const now = Date.now()
  for (const m of arr) {
    const k = msgKey(m)
    if (!k || seen.has(k)) continue
    seen.set(k, now)
    if (seen.size > 8000) {
      const cutoff = now - 60_000
      for (const [kk, t] of seen) if (t < cutoff) seen.delete(kk)
    }
    for (const fn of listeners) fn(m)
  }
}

// ------------ main initialization ------------
export const initTradeStream = () => {
  if (initialized || typeof window === 'undefined' || !('WebSocket' in window)) return
  initialized = true
  const Native = window.WebSocket

  class ProxyWS extends Native {
    constructor(url: string | URL, protocols?: string | string[]) {
      const u = String(url)
      const existing = sockets.get(u)
      if (existing) return existing as any
      super(url, protocols as any)
      sockets.set(u, this)
      this.addEventListener('message', e => emit(parse(e.data)))
      this.addEventListener('close', () => sockets.delete(u))
      this.addEventListener('error', () => {})
    }
  }

  Object.defineProperty(window, 'WebSocket', { value: ProxyWS })
}

export const onTradeStream = (fn: Listener): (() => void) => {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export const getActiveSockets = () => Array.from(sockets.values())
