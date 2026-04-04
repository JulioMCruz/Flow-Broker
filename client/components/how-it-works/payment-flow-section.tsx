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
} from "lucide-react"

const flowSteps = [
  {
    icon: ClipboardList,
    title: "Complete your risk profile quiz",
    description: "Answer 5 questions to determine your investment style",
  },
  {
    icon: User,
    title: "Choose your broker agent",
    description: "Select conservative, balanced, or alpha based on your risk profile",
  },
  {
    icon: Wallet,
    title: "Fund wallet with USDC",
    description: "Connect your wallet and deposit USDC to activate your agent",
  },
  {
    icon: CreditCard,
    title: "Agent pays per call via Arc x402",
    description: "Gas-free, USDC micropayments from $0.000002 to $0.015",
  },
  {
    icon: Database,
    title: "PaymentAccumulator.sol logs payments",
    description: "Every payment recorded on-chain for transparency",
  },
  {
    icon: Settings,
    title: "Chainlink CRE orchestrates",
    description: "Health check, pricing update, batch settlement automatically",
  },
  {
    icon: Brain,
    title: "Agent makes decision",
    description: "Based on intelligence gathered within your risk limits",
  },
  {
    icon: ArrowRight,
    title: "Trade executed",
    description: "Within your pre-defined risk parameters",
  },
  {
    icon: FileText,
    title: "Report generated",
    description: "Decision summary sent to your dashboard",
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
            From quiz to trade execution in 9 steps
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
