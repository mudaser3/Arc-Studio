import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { Bot, Zap, ShieldCheck, ExternalLink } from 'lucide-react'
import { AgentRegistration } from './components/AgentRegistration'
import { X402ServicePanel } from './components/X402ServicePanel'
import { ReputationPanel } from './components/ReputationPanel'
import { buildAddressExplorerUrl } from '@/onchain-facts'
import { arcTestnet } from 'viem/chains'

const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e'
const SELLER_ADDRESS = import.meta.env.VITE_SELLER_ADDRESS as string | undefined

type Tab = 'identity' | 'services' | 'reputation'

export default function App() {
  const { address } = useAccount()
  const [tab, setTab] = useState<Tab>('identity')
  const [registeredAgentId, setRegisteredAgentId] = useState<bigint | null>(null)
  const [registeredTxHash, setRegisteredTxHash] = useState<string | null>(null)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'identity', label: 'Identity', icon: <ShieldCheck size={14} /> },
    { id: 'services', label: 'x402 Services', icon: <Zap size={14} /> },
    { id: 'reputation', label: 'Reputation', icon: <Bot size={14} /> },
  ]

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{ background: 'var(--accent)' }}>
              <Bot size={16} color="#fff" />
            </div>
            <div>
              <div className="display text-sm font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
                Arc Agent
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>ERC-8004 + x402</div>
            </div>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-5 pb-12">

        {/* Hero card */}
        <div className="rounded-2xl px-5 py-5"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
          }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent)' }}>
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <h1 className="display text-lg font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                Onchain AI Agent
              </h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Arc Testnet — ERC-8004 Identity + x402 Payments</p>
            </div>
          </div>

          {/* Registered badge */}
          {registeredAgentId !== null && (
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(26,128,71,0.08)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} style={{ color: 'var(--success)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                  Agent ID #{registeredAgentId.toString()} — Registered
                </span>
              </div>
              {registeredTxHash && (
                <a
                  href={buildAddressExplorerUrl(arcTestnet.id, IDENTITY_REGISTRY)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--success)' }}
                >
                  Registry <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}

          {/* Not connected state */}
          {!address && (
            <div className="rounded-xl px-4 py-3 text-sm text-center"
              style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
              Connect your wallet to register an agent or probe the x402 endpoints.
            </div>
          )}
        </div>

        {/* Tab nav */}
        <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--surface-muted)' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all"
              style={
                tab === t.id
                  ? { background: 'var(--surface-strong)', color: 'var(--ink)', boxShadow: '0 1px 4px rgba(18,45,69,0.08)' }
                  : { color: 'var(--muted)' }
              }
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl px-5 py-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}>

          {tab === 'identity' && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="display text-base font-bold mb-0.5" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  Register Agent Identity
                </h2>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Mints an ERC-8004 agent NFT on Arc Testnet. The registration file includes your x402-gated service endpoints.
                </p>
              </div>
              {address ? (
                <AgentRegistration
                  sellerAddress={SELLER_ADDRESS ?? ''}
                  onRegistered={(id, hash) => {
                    setRegisteredAgentId(id)
                    setRegisteredTxHash(hash)
                  }}
                />
              ) : (
                <div className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>
                  Connect wallet to register.
                </div>
              )}

              {/* Registry info */}
              <div className="rounded-xl px-4 py-3 text-xs flex flex-col gap-1"
                style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
                <div className="font-semibold mb-0.5" style={{ color: 'var(--ink-2)' }}>IdentityRegistry (ERC-8004)</div>
                <a
                  href={buildAddressExplorerUrl(arcTestnet.id, IDENTITY_REGISTRY)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono underline underline-offset-2 break-all flex items-center gap-1"
                  style={{ color: 'var(--accent)' }}
                >
                  {IDENTITY_REGISTRY} <ExternalLink size={10} />
                </a>
              </div>
            </div>
          )}

          {tab === 'services' && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="display text-base font-bold mb-0.5" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  x402 Paid Endpoints
                </h2>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  These endpoints require Circle Gateway Nanopayment. Send an unpaid probe to see the 402 response.
                  Add <code className="mono text-xs">VITE_SELLER_ADDRESS</code> to <code className="mono text-xs">.env</code> to activate payment settlement.
                </p>
              </div>
              <X402ServicePanel agentId={registeredAgentId} />
            </div>
          )}

          {tab === 'reputation' && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="display text-base font-bold mb-0.5" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  Onchain Reputation
                </h2>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Live reputation score from the ERC-8004 ReputationRegistry. A second wallet can call{' '}
                  <code className="mono text-xs">giveFeedback</code> to rate this agent.
                </p>
              </div>
              {registeredAgentId !== null ? (
                <ReputationPanel agentId={registeredAgentId} />
              ) : (
                <div className="rounded-xl px-4 py-8 text-sm text-center"
                  style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
                  Register your agent first to view reputation.
                </div>
              )}
            </div>
          )}
        </div>

        {/* How-it-works */}
        <div className="rounded-2xl px-5 py-5 flex flex-col gap-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>How it works</h3>
          <ol className="flex flex-col gap-2.5">
            {[
              { step: '1', label: 'Register', desc: 'Connect wallet → Register Identity tab → one transaction mints your agent NFT.' },
              { step: '2', label: 'Earn', desc: 'x402 Services tab → any agent pays $0.01–$0.005 per call via Circle Gateway Nanopayments.' },
              { step: '3', label: 'Build reputation', desc: 'After each job, clients write feedback to the ReputationRegistry. Scores are fully onchain.' },
            ].map(item => (
              <li key={item.step} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  {item.step}
                </div>
                <div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{item.label}: </span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  )
}
