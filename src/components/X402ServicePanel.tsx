/**
 * x402 Service Panel
 * Shows the two paid endpoints, their prices, and lets the user probe them.
 */
import { useState } from 'react'
import { Zap, AlertCircle, CheckCircle, ChevronRight, Lock } from 'lucide-react'

interface Endpoint {
  method: 'POST' | 'GET'
  path: string
  price: string
  description: string
  exampleBody: Record<string, unknown>
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'POST',
    path: '/summarize',
    price: '$0.01',
    description: 'Returns an onchain data summary for a given topic.',
    exampleBody: { topic: 'Arc Testnet activity' },
  },
  {
    method: 'POST',
    path: '/analyze',
    price: '$0.005',
    description: 'Analyzes a registered ERC-8004 agent by ID.',
    exampleBody: { agentId: 1 },
  },
]

interface ProbeResult {
  status: number
  body: unknown
  paymentRequired?: boolean
}

export function X402ServicePanel({ agentId }: { agentId: bigint | null }) {
  const [results, setResults] = useState<Record<string, ProbeResult | null>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  async function probe(ep: Endpoint) {
    setLoading(l => ({ ...l, [ep.path]: true }))
    try {
      // Send unpaid request — expect 402
      const res = await fetch('/api' + ep.path, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          ep.path === '/analyze' && agentId !== null
            ? { agentId: Number(agentId) }
            : ep.exampleBody,
        ),
      })
      let body: unknown
      try { body = await res.json() } catch { body = null }
      setResults(r => ({
        ...r,
        [ep.path]: {
          status: res.status,
          body,
          paymentRequired: res.status === 402,
        },
      }))
    } catch (e) {
      setResults(r => ({
        ...r,
        [ep.path]: { status: 0, body: { error: String(e) } },
      }))
    } finally {
      setLoading(l => ({ ...l, [ep.path]: false }))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {ENDPOINTS.map(ep => {
        const result = results[ep.path]
        const isLoading = loading[ep.path]

        return (
          <div
            key={ep.path}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wider"
                style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}
              >
                {ep.method}
              </div>
              <code className="text-sm font-semibold mono" style={{ color: 'var(--ink)' }}>{ep.path}</code>
              <div className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: 'rgba(18,45,69,0.08)', color: 'var(--accent)' }}>
                <Zap size={11} />
                {ep.price} / call
              </div>
            </div>

            <div className="px-4 pb-3 text-sm" style={{ color: 'var(--muted)' }}>
              {ep.description}
            </div>

            {/* Request body preview */}
            <div className="mx-4 mb-3 rounded-xl px-3 py-2.5 text-xs mono"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>
              {JSON.stringify(
                ep.path === '/analyze' && agentId !== null ? { agentId: Number(agentId) } : ep.exampleBody,
                null, 2
              )}
            </div>

            {/* Probe button */}
            <div className="px-4 pb-4">
              <button
                onClick={() => { void probe(ep) }}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: 'var(--surface-muted)', color: 'var(--ink)' }}
              >
                {isLoading ? 'Probing...' : 'Send unpaid probe (expect 402)'}
                {!isLoading && <ChevronRight size={14} />}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  {result.paymentRequired ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#b45309' }}>
                      <Lock size={13} />
                      HTTP 402 — Payment Required
                    </div>
                  ) : result.status === 200 ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--success)' }}>
                      <CheckCircle size={13} />
                      HTTP 200 — Paid response
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--danger)' }}>
                      <AlertCircle size={13} />
                      HTTP {result.status}
                    </div>
                  )}
                </div>
                <pre className="rounded-xl px-3 py-2.5 text-xs overflow-auto mono"
                  style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', maxHeight: 160 }}>
                  {JSON.stringify(result.body, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )
      })}

      {/* x402 protocol note */}
      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
        <span className="font-semibold" style={{ color: 'var(--ink-2)' }}>How x402 works: </span>
        An agent calls the endpoint without payment and receives HTTP 402 with Circle Gateway payment details.
        It then signs a USDC transfer authorization and retries with an{' '}
        <code className="mono text-xs">X-PAYMENT</code> header. The middleware settles onchain via Circle Gateway Nanopayments.
        Use the <span className="font-semibold">circle</span> CLI (<code className="mono text-xs">circle services pay</code>) to call as a buyer agent.
      </div>
    </div>
  )
}
