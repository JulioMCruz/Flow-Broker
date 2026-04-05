"use client"

import { Card } from "@/components/ui/card"
import {
  Wallet,
  User,
  CreditCard,
  Database,
  Settings,
  Brain,
  ArrowRight,
  FileText,
  ChevronDown,
  ClipboardList,
  Search,
  TrendingUp,
} from "lucide-react"

const flowSteps = [
  {
    icon: ClipboardList,
    title: "Complete your risk profile quiz",
    description: "Answer 5 questions to determine your investment style — conservative to alpha",
  },
  {
    icon: User,
    title: "Choose your broker agent",
    description: "Get matched to one of 8 brokers (Guardian to Titan), each with different intelligence providers and trading strategies",
  },
  {
    icon: Wallet,
    title: "Deposit USDC on Arc Testnet",
    description: "Connect your wallet and deposit USDC to activate your broker agent",
  },
  {
    icon: Settings,
    title: "Chainlink CRE orchestrates the agents",
    description: "CRE runs continuously: Health Monitor pings agents every 5 min, Dynamic Pricing fetches ETH/USD and updates provider prices via ENS every 30 min, Settlement Monitor tracks Circle Gateway batches",
  },
  {
    icon: CreditCard,
    title: "Broker buys intelligence via x402 nanopayments",
    description: "Your broker pays 10 specialized providers per call — market data ($0.000002), sentiment ($0.0003), AI analysis ($0.015). All gas-free via Circle Gateway. Prices come from ENS, set by CRE",
  },
  {
    icon: Search,
    title: "Providers return financial intelligence",
    description: "Market prices, sentiment scores, chart patterns, risk calculations, portfolio optimization — each provider returns specialized data",
  },
  {
    icon: Brain,
    title: "Broker aggregates signals and decides",
    description: "Every 5 intelligence calls, broker runs a risk check. If all signals align — BUY. If not — HOLD. Different brokers have different risk thresholds",
  },
  {
    icon: TrendingUp,
    title: "Trade executed on Uniswap",
    description: "On BUY signal, broker calls Uniswap Trading API on Sepolia — gets a quote, builds the swap, signs and broadcasts. Conservative brokers swap ETH→USDC, aggressive brokers swap ETH→UNI",
  },
  {
    icon: Database,
    title: "Everything verifiable on-chain",
    description: "x402 payments batched by Circle Gateway on Arc. Uniswap trades on Sepolia Etherscan. Agent prices on ENS (flowbroker.eth). All with real transaction hashes",
  },
  {
    icon: FileText,
    title: "Dashboard shows everything live",
    description: "Real-time flow visualization, payment feed, broker decisions with AI reasoning, Uniswap trade history, and CRE workflow logs — all updating via WebSocket",
  },
]

export function PaymentFlowSection() {
  return (
    <section className="py-20 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-foreground">
            The payment <span className="font-serif italic text-primary">flow</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-light">
            From quiz to Uniswap trade in 10 steps
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {flowSteps.map((step, index) => (
              <div key={step.title} className="relative">
                <Card className="bg-card border-border p-6 mb-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-lg font-medium text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground font-light">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>

                {index < flowSteps.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ChevronDown className="w-5 h-5 text-primary/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
