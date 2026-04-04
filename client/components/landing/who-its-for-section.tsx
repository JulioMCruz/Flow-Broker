"use client"

import { Card } from "@/components/ui/card"
import { User, Wallet, Users, Building2 } from "lucide-react"

const audiences = [
  {
    title: "Crypto-native individuals",
    description: "Already in DeFi, want smarter execution",
    type: "primary",
    icon: User,
  },
  {
    title: "Non-crypto investors entering DeFi",
    description: "Want exposure without the complexity",
    type: "primary",
    icon: Wallet,
  },
  {
    title: "Quant teams with agent fleets",
    description: "Scale autonomous strategies",
    type: "enterprise",
    icon: Users,
  },
  {
    title: "Fintechs & wealth platforms",
    description: "White-label autonomous trading",
    type: "enterprise",
    icon: Building2,
  },
]



export function WhoItsForSection() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground">
            Who it&apos;s <span className="font-serif italic text-primary">for</span>
          </h2>
        </div>

        {/* Audience Grid */}
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mb-16">
          {audiences.map((audience) => (
            <Card
              key={audience.title}
              className="bg-card border-border p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <audience.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">
                    {audience.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground font-light">
                    {audience.description}
                  </p>
                  <span className={`mt-2 inline-block text-xs font-mono ${
                    audience.type === "primary" ? "text-primary" : "text-amber-500"
                  }`}>
                    {audience.type}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        </div>
    </section>
  )
}
