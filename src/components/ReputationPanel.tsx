/**
 * ERC-8004 Reputation Panel
 * Reads on-chain reputation summary for a registered agent.
 * Feedback must come from a different wallet than the owner.
 */
import { useReadContract } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { Star, Users, AlertCircle } from 'lucide-react'

const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const

const reputationAbi = [
  {
    type: 'function',
    name: 'getClients',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getSummary',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' },
    ],
  },
] as const

export function ReputationPanel({ agentId }: { agentId: bigint }) {
  const { data: clients, isLoading: loadingClients } = useReadContract({
    address: REPUTATION_REGISTRY,
    abi: reputationAbi,
    functionName: 'getClients',
    args: [agentId],
    chainId: arcTestnet.id,
  })

  const clientList = (clients ?? [])

  const { data: summary, isLoading: loadingSummary } = useReadContract({
    address: REPUTATION_REGISTRY,
    abi: reputationAbi,
    functionName: 'getSummary',
    args: [agentId, clientList.length > 0 ? clientList : ['0x0000000000000000000000000000000000000001'], '', ''],
    chainId: arcTestnet.id,
    query: { enabled: !loadingClients },
  })

  const isLoading = loadingClients || loadingSummary
  const count = summary?.[0] ?? 0n
  const rawScore = summary?.[1] ?? 0n
  const decimals = summary?.[2] ?? 0

  const score = decimals > 0 ? Number(rawScore) / Math.pow(10, decimals) : Number(rawScore)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl px-5 py-4 flex flex-col items-center gap-1 flex-1"
          style={{ background: 'var(--surface-muted)' }}>
          <Star size={18} style={{ color: '#f59e0b' }} />
          <div className="display text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {isLoading ? '—' : count === 0n ? 'N/A' : score.toFixed(1)}
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Avg. Score</div>
        </div>
        <div className="rounded-2xl px-5 py-4 flex flex-col items-center gap-1 flex-1"
          style={{ background: 'var(--surface-muted)' }}>
          <Users size={18} style={{ color: 'var(--accent)' }} />
          <div className="display text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {isLoading ? '—' : count.toString()}
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Feedbacks</div>
        </div>
      </div>

      {count === 0n && !isLoading && (
        <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs"
          style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--subtle)' }} />
          No feedback yet. A second wallet can call{' '}
          <code className="mono text-xs mx-0.5">giveFeedback</code> on the ReputationRegistry to rate this agent.
          Agents cannot rate themselves.
        </div>
      )}

      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
        <div className="font-semibold mb-1.5" style={{ color: 'var(--ink-2)' }}>ReputationRegistry</div>
        <code className="mono break-all">{REPUTATION_REGISTRY}</code>
      </div>
    </div>
  )
}
