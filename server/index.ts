/**
 * Agent Payment Server — x402 / Circle Gateway Nanopayments
 * Exposes two paid endpoints that any agent can call after paying in USDC.
 */
import express from 'express'
import { createGatewayMiddleware } from '@circle-fin/x402-batching/server'

const app = express()
app.use(express.json())
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,X-PAYMENT,X-PAYMENT-RESPONSE')
  if (_req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const sellerAddress = process.env.VITE_SELLER_ADDRESS

if (!sellerAddress) {
  console.warn('[server] VITE_SELLER_ADDRESS is not set — x402 payments will reject.')
}

// Gateway middleware — uses Arc Testnet by default
const gateway = createGatewayMiddleware({
  sellerAddress: sellerAddress ?? '0x0000000000000000000000000000000000000000',
})

// ---- Paid endpoints -------------------------------------------------------

/**
 * POST /summarize  ($0.01 per call)
 * Accepts: { topic: string }
 * Returns: { summary: string }
 */
app.post('/summarize', gateway.require('$0.01'), (req, res) => {
  const topic = (req.body?.topic as string) || 'general onchain activity'
  res.json({
    summary: `Onchain summary for "${topic}": Arc Testnet is live with sub-second finality. USDC is the native gas token (6 decimal ERC-20 view, 18 decimal native view). Registry writes cost ~0.006 USDC each. This response was paid via x402 Circle Gateway Nanopayment.`,
    timestamp: new Date().toISOString(),
    paidWith: 'Circle Gateway Nanopayment (x402)',
  })
})

/**
 * POST /analyze  ($0.005 per call)
 * Accepts: { agentId: number }
 * Returns: { analysis: string }
 */
app.post('/analyze', gateway.require('$0.005'), (req, res) => {
  const agentId = req.body?.agentId ?? 'unknown'
  res.json({
    analysis: `Agent #${agentId} analysis: reputation is verified onchain via ERC-8004 ReputationRegistry. Feedback count and weighted score can be queried with getSummary(). This response was paid via x402 Circle Gateway Nanopayment.`,
    timestamp: new Date().toISOString(),
    paidWith: 'Circle Gateway Nanopayment (x402)',
  })
})

// ---- Health ---------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ status: 'ok', sellerConfigured: !!sellerAddress }))

// ---- 402 probe (unpaid GET) -----------------------------------------------
app.get('/summarize', gateway.require('$0.01'), (_req, res) => {
  res.json({ status: 'reachable — use POST with payment' })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`[server] x402 payment server running on http://localhost:${PORT}`)
  console.log(`[server] sellerAddress: ${sellerAddress ?? '(not set)'}`)
})
