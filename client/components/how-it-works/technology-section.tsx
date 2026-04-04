"use client"

import { Card } from "@/components/ui/card"

const technologies = [
  {
    title: "Why Arc — the only rail that works",
    description:
      "Stripe minimum: $0.30 per transaction. Our payments: $0.000002. Stripe would charge 150× the payment value. Ethereum gas exceeds the payment amount. Arc is the only infrastructure where sub-cent agent payments are economically viable.",
    stats: ["Gas-free", "USDC native", "x402 protocol", "Batch settlement"],
    color: "primary",
  },
  {
    title: "Why Chainlink CRE — decentralized orchestration",
    description:
      "We run three workflows: Agent health monitoring — detects failed intelligence services and reroutes. Dynamic pricing — updates ENS text records with market rates. Batch settlement — collapses thousands of micropayments into one transaction.",
    stats: ["3 workflows live", "No backend server", "Fault-tolerant DON"],
    color: "blue",
  },
  {
    title: "Why ENS — config and discovery layer",
    description:
      "Every intelligence service has an ENS name. Pricing lives in text records — change a price, all agents react instantly without redeploy. Agents discover services by resolving ENS names, not hardcoded URLs. Your broker has an ENS identity with its strategy and track record on-chain.",
    stats: ["10 services with ENS names", "Live config updates", "On-chain discovery"],
    color: "amber",
  },
]

export function TechnologySection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-foreground">
            The <span className="font-serif italic text-primary">technology</span>
          </h2>
          <p className="mt-4 text-muted-foreground font-light">
            Built on three pillars of decentralized infrastructure
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {technologies.map((tech) => (
            <Card
              key={tech.title}
              className="bg-card border-border p-8 hover:border-primary/50 transition-colors flex flex-col"
            >
              <h3 className="text-xl font-medium text-foreground mb-4">
                {tech.title}
              </h3>
              <p className="text-muted-foreground font-light leading-relaxed mb-6 flex-1">
                {tech.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {tech.stats.map((stat) => (
                  <span
                    key={stat}
                    className={`px-3 py-1 rounded-full text-xs font-mono ${
                      tech.color === "primary"
                        ? "bg-primary/10 text-primary"
                        : tech.color === "blue"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {stat}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
