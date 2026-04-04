"use client"

import { Card } from "@/components/ui/card"
import { Check, X, Minus } from "lucide-react"

const comparisonData = [
  {
    feature: "Market data",
    bloomberg: "$2,000/month",
    traditional: "bundled in fees",
    flowbroker: "$0.000002/call",
  },
  {
    feature: "Sentiment analysis",
    bloomberg: "included in $2K",
    traditional: "not available",
    flowbroker: "$0.0003/call",
  },
  {
    feature: "AI-powered analysis",
    bloomberg: "not available",
    traditional: "not available",
    flowbroker: "$0.015/analysis",
  },
  {
    feature: "Trade execution fee",
    bloomberg: "0.5–2%",
    traditional: "0.1–1%",
    flowbroker: "0.1%",
  },
  {
    feature: "Human intervention",
    bloomberg: "yes",
    traditional: "yes",
    flowbroker: "none",
    flowbrokerHighlight: true,
  },
  {
    feature: "Pay only what you use",
    bloomberg: "no",
    traditional: "no",
    flowbroker: "yes",
    flowbrokerHighlight: true,
  },
  {
    feature: "Full analysis cost",
    bloomberg: "$2,000/month",
    traditional: "$500–1,000/month",
    flowbroker: "$0.031/decision",
    flowbrokerHighlight: true,
  },
]

const costBars = [
  {
    label: "Bloomberg Terminal",
    cost: "$2,000/month",
    width: "100%",
    color: "bg-destructive",
  },
  {
    label: "Traditional broker APIs",
    cost: "$800/month",
    width: "40%",
    color: "bg-amber-500",
  },
  {
    label: "FlowBroker balanced agent",
    cost: "~$15/month",
    width: "2%",
    color: "bg-primary",
  },
]

export function ComparisonSection() {
  return (
    <section className="py-20 md:py-32 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground">
            What we <span className="font-serif italic text-primary">replace</span>
          </h2>
        </div>

        {/* Comparison Table */}
        <Card className="bg-card border-border overflow-hidden mb-16">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 md:p-6 text-sm font-medium text-muted-foreground">
                    What you need
                  </th>
                  <th className="text-center p-4 md:p-6 text-sm font-medium text-muted-foreground">
                    Bloomberg Terminal
                  </th>
                  <th className="text-center p-4 md:p-6 text-sm font-medium text-muted-foreground">
                    Traditional broker
                  </th>
                  <th className="text-center p-4 md:p-6 text-sm font-medium text-primary">
                    FlowBroker
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={index !== comparisonData.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="p-4 md:p-6 text-sm font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="p-4 md:p-6 text-center">
                      <CellValue value={row.bloomberg} />
                    </td>
                    <td className="p-4 md:p-6 text-center">
                      <CellValue value={row.traditional} />
                    </td>
                    <td className="p-4 md:p-6 text-center">
                      <CellValue value={row.flowbroker} highlight={row.flowbrokerHighlight} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Cost Comparison Chart */}
        <div className="space-y-6">
          <h3 className="text-xl font-medium text-foreground text-center mb-8">
            Monthly cost comparison
          </h3>
          <div className="space-y-4">
            {costBars.map((bar) => (
              <div key={bar.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-light">{bar.label}</span>
                  <span className="font-mono text-foreground">{bar.cost}</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bar.color} rounded-full transition-all duration-1000`}
                    style={{ width: bar.width }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-2xl font-mono text-primary mt-8">
            99.25% cheaper
          </p>
        </div>
      </div>
    </section>
  )
}

function CellValue({ value, highlight }: { value: string; highlight?: boolean }) {
  const isNegative = value === "not available" || value === "no"
  const isPositive = value === "yes" || value === "none"

  if (isNegative) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <X className="w-4 h-4 text-destructive" />
        <span className="hidden sm:inline">{value}</span>
      </span>
    )
  }

  if (isPositive && highlight) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
        <Check className="w-4 h-4" />
        <span>{value}</span>
      </span>
    )
  }

  return (
    <span className={`text-sm font-mono ${highlight ? "text-primary font-medium" : "text-muted-foreground"}`}>
      {value}
    </span>
  )
}
