"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Are the payments real?",
    answer:
      "Yes. Every payment is a real on-chain transaction on Arc Testnet. The contracts are deployed and verifiable. You can inspect every payment your agent makes in the dashboard.",
  },
  {
    question: "Does my agent make real trades?",
    answer:
      "Your agent executes transactions within the parameters you set. On testnet, these are simulated. On mainnet launch, your agent will execute real trades using your deposited funds.",
  },
  {
    question: "How do I know my agent is working?",
    answer:
      "Every decision your agent makes is logged on-chain and visible in your dashboard. You&apos;ll see which intelligence services were queried, how much each call cost, and the reasoning behind each trade decision.",
  },
  {
    question: "What happens if an intelligence service goes down?",
    answer:
      "Chainlink CRE monitors all intelligence services every 5 minutes. If a service fails, your agent automatically reroutes to alternative providers. Your trades are never blocked by a single point of failure.",
  },
  {
    question: "Can I change my broker agent later?",
    answer:
      "Yes. You can switch between conservative, balanced, and alpha agents at any time. Your portfolio history and settings are preserved. The new agent will start making decisions based on its strategy.",
  },
  {
    question: "What are the fees?",
    answer:
      "You pay only for the intelligence your agent uses — from $0.000002 for market data to $0.015 for AI analysis. Trade execution is 0.1%. There are no monthly minimums, no hidden fees, and no subscription required for the Starter plan.",
  },
  {
    question: "Is my money safe?",
    answer:
      "Your funds remain in your wallet until a trade is executed. Agents can only execute trades within your pre-defined risk limits. All contracts are audited and deployed on secure infrastructure.",
  },
  // Technical FAQs for end customers
  {
    question: "What is Arc and why do you use it?",
    answer:
      "Arc is Circle&apos;s blockchain designed specifically for micropayments. Traditional payment systems like Stripe charge $0.30 minimum per transaction — impossible for payments of $0.000002. Arc allows us to process sub-cent payments in USDC instantly and without gas fees. Your agent pays exactly what it uses, nothing more.",
  },
  {
    question: "What is an ENS identity and why does my agent have one?",
    answer:
      "ENS (Ethereum Name Service) is like a domain name for blockchain. Instead of a long wallet address like 0x7a9f..., your agent has a readable name like balanced.flowbroker.eth. This makes it easy to verify your agent&apos;s history, reputation, and all its transactions on-chain. Anyone can look it up.",
  },
  {
    question: "What does Chainlink CRE do?",
    answer:
      "Chainlink CRE (Compute Runtime Environment) is the decentralized system that orchestrates everything behind the scenes. It monitors intelligence services every 5 minutes, updates prices every 10 minutes, and batches thousands of micropayments into single transactions every 30 minutes — saving you gas costs. All this runs without any central server that could fail.",
  },
  {
    question: "What is the Risk Manager and how does it protect me?",
    answer:
      "The Risk Manager is a special validation layer that reviews every decision before execution. It checks: Is this within your risk tolerance? Is market volatility acceptable? Is your total exposure correct? If anything looks wrong, it blocks the trade. No operation happens without Risk Manager approval.",
  },
  {
    question: "How can I verify what my agent is doing?",
    answer:
      "Every single action is recorded on-chain and visible in your dashboard. You can see: which intelligence services were called, how much each cost, the data received, the Risk Manager&apos;s validation, and the final decision. You can also look up your agent&apos;s ENS name on any blockchain explorer.",
  },
  {
    question: "What is USDC and why do you use it?",
    answer:
      "USDC is a stablecoin — a digital dollar that always equals $1. We use it because its value doesn&apos;t fluctuate like crypto. When your agent pays $0.015 for AI analysis, it pays exactly $0.015 in real value. Your costs are predictable and transparent.",
  },
  {
    question: "What happens if I lose internet during a trade?",
    answer:
      "Your agent runs on decentralized infrastructure, not on your device. If you go offline, your agent continues operating within the limits you set. When you reconnect, you&apos;ll see everything that happened in your dashboard. Nothing is lost.",
  },
  {
    question: "Can the system be hacked?",
    answer:
      "FlowBroker uses audited smart contracts deployed on secure blockchains. Your funds stay in your wallet until a trade executes. Agents can only operate within your pre-defined limits. There&apos;s no central database to hack — everything is distributed across the blockchain.",
  },
  {
    question: "What are intelligence services exactly?",
    answer:
      "Intelligence services are specialized data feeds your agent consumes to make decisions. Market data gives real-time prices. Sentiment analysis reads news and social signals. AI analysis provides deep reasoning. Pattern recognition spots chart formations. Each service has a specific cost per call — your agent only pays for what it needs.",
  },
  {
    question: "Why is FlowBroker so much cheaper than Bloomberg?",
    answer:
      "Bloomberg charges a flat $2,000/month whether you use it or not. FlowBroker charges per use: $0.000002 for market data, $0.015 for AI analysis. A balanced agent making 500 decisions per month costs roughly $15 — 99% cheaper than Bloomberg. You pay for actual value, not access.",
  },
]

export function FaqSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-foreground">
            Frequently asked <span className="font-serif italic text-primary">questions</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-lg bg-card px-6 data-[state=open]:border-primary/50"
            >
              <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-light leading-relaxed pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
