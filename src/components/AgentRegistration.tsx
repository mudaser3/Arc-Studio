/**
 * ERC-8004 Agent Registration
 * Lets the connected wallet register a new agent identity on Arc Testnet.
 */
import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseEventLogs } from 'viem'
import { arcTestnet } from 'viem/chains'
import { CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'

const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const

const identityAbi = [
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Registered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const

interface Props {
  sellerAddress: string
  onRegistered: (agentId: bigint, txHash: string) => void
}

export function AgentRegistration({ sellerAddress, onRegistered }: Props) {
  const { address, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [agentName, setAgentName] = useState('My Arc Agent')
  const [agentDescription, setAgentDescription] = useState('An onchain AI agent with ERC-8004 identity and x402 payments.')
  const [agentIdResult, setAgentIdResult] = useState<bigint | null>(null)
  const [regError, setRegError] = useState<string | null>(null)

  const {
    writeContract,
    data: txHash,
    isPending: isWaitingWallet,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash })

  // Parse agentId from Registered event once confirmed
  if (isSuccess && receipt && agentIdResult === null && txHash) {
    try {
      const [evt] = parseEventLogs({ abi: identityAbi, eventName: 'Registered', logs: receipt.logs })
      if (evt) {
        setAgentIdResult(evt.args.agentId)
        onRegistered(evt.args.agentId, txHash)
      }
    } catch {
      // event may not be parsed yet
    }
  }

  const isWrongChain = chainId !== arcTestnet.id

  function buildAgentURI(): string {
    const card = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: agentName,
      description: agentDescription,
      services: [
        {
          name: 'summarize',
          endpoint: `${window.location.origin}/summarize`,
          version: '1.0.0',
        },
        {
          name: 'analyze',
          endpoint: `${window.location.origin}/analyze`,
          version: '1.0.0',
        },
      ],
      x402Support: true,
      active: true,
      registrations: [],
      supportedTrust: ['reputation'],
    }
    // Encode as a data URI so the URI is self-contained (no IPFS needed for demo)
    return 'data:application/json;base64,' + btoa(JSON.stringify(card))
  }

  function handleRegister() {
    if (!address) return
    setRegError(null)
    reset()
    setAgentIdResult(null)

    if (isWrongChain) {
      switchChain({ chainId: arcTestnet.id })
      return
    }

    try {
      writeContract({
        address: IDENTITY_REGISTRY,
        abi: identityAbi,
        functionName: 'register',
        args: [buildAgentURI()],
        chainId: arcTestnet.id,
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setRegError(msg)
    }
  }

  const isLoading = isWaitingWallet || isConfirming || isSwitching

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
          Agent Name
        </label>
        <input
          className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all border focus:border-opacity-60"
          style={{
            background: 'var(--surface-muted)',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
          }}
          value={agentName}
          onChange={e => setAgentName(e.target.value)}
          disabled={isLoading || isSuccess}
          placeholder="My Arc Agent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
          Description
        </label>
        <textarea
          rows={2}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none transition-all border"
          style={{
            background: 'var(--surface-muted)',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
          }}
          value={agentDescription}
          onChange={e => setAgentDescription(e.target.value)}
          disabled={isLoading || isSuccess}
        />
      </div>

      <div className="rounded-xl px-4 py-3 text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
        <span className="font-semibold" style={{ color: 'var(--ink-2)' }}>Seller address: </span>
        <span className="mono">{sellerAddress || '(not set — add VITE_SELLER_ADDRESS to .env)'}</span>
      </div>

      {isSuccess && agentIdResult !== null ? (
        <div className="flex flex-col gap-3 rounded-xl p-4" style={{ background: '#d1fae5', color: '#065f46' }}>
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle size={18} />
            Agent registered — ID #{agentIdResult.toString()}
          </div>
          {txHash && (
            <a
              href={buildTxExplorerUrl(arcTestnet.id, txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs underline underline-offset-2"
            >
              View on Arc Explorer <ExternalLink size={12} />
            </a>
          )}
        </div>
      ) : (
        <button
          onClick={handleRegister}
          disabled={isLoading || !address}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all disabled:opacity-50"
          style={{
            background: 'var(--accent)',
            color: '#fff',
          }}
        >
          {isWaitingWallet && <Loader2 size={16} className="animate-spin" />}
          {isConfirming && <Loader2 size={16} className="animate-spin" />}
          {isSwitching
            ? 'Switching to Arc...'
            : isWrongChain
            ? 'Switch to Arc Testnet'
            : isWaitingWallet
            ? 'Confirm in wallet...'
            : isConfirming
            ? 'Registering onchain...'
            : 'Register Agent Identity (ERC-8004)'}
        </button>
      )}

      {regError && (
        <div className="flex items-start gap-2 rounded-xl px-4 py-3 text-xs" style={{ background: '#fee2e2', color: '#991b1b' }}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{regError}</span>
        </div>
      )}
    </div>
  )
}
