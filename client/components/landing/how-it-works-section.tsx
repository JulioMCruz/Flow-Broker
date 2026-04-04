"use client"

import { Card } from "@/components/ui/card"

const steps = [
  {
    number: "01",
    title: "Tell us your risk appetite",
    description: "5-question risk profile quiz → generates Conservative/Balanced/Alpha score",
  },
  {
    number: "02",
    title: "Choose your autonomous broker",
    description: "ENS identity, on-chain track record",
  },
  {
    number: "03",
    title: "Your broker buys intelligence",
    description: "Pays per call in USDC via Arc nanopayments ($0.000002 to $0.015)",
  },
  {
    number: "04",
    title: "Chainlink CRE orchestrates",
    description: "3 decentralized workflows, no backend server",
  },
  {
    number: "05",
    title: "Trade executed, report generated",
    description: "Dashboard, P&L, intelligence cost breakdown",
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground">
            How it <span className="font-serif italic text-primary">works</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Card
              key={step.number}
              className={`bg-card border-border p-6 md:p-8 hover:border-primary/50 transition-colors ${
                index === 4 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <span className="text-5xl md:text-6xl font-mono font-light text-primary/30">
                {step.number}
              </span>
              <h3 className="mt-4 text-xl font-medium text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-muted-foreground font-light leading-relaxed">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
