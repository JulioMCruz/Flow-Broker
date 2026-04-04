"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AnimatedCounter } from "@/components/animated-counter"

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-16">
      {/* Grid Background */}
      <div className="absolute inset-0 hero-grid pointer-events-none" />
      
      {/* Subtle glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-tight text-balance">
            <span className="font-serif italic text-primary">Choose your strategy,</span>
            <br />
            <span className="text-foreground">not your trades.</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 md:mt-8 text-lg md:text-xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed text-pretty">
            FlowBroker gives you an autonomous AI broker that manages your investments — buying the intelligence it needs, paying per call, executing trades on your behalf. No charts. No jargon. Just results.
          </p>

          {/* CTAs */}
          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8"
            >
              <Link href="/find-your-broker">Find your broker agent</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="text-foreground hover:text-primary text-base"
            >
              <Link href="/how-it-works">
                See how it works
                <span className="ml-1">→</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Live Stats Bar */}
        <div className="mt-16 md:mt-24">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 lg:gap-12">
            <StatItem value={173} suffix="/min" label="payments live" />
            <Divider />
            <StatItem prefix="$" value={0.031} decimals={3} label="avg decision cost" />
            <Divider />
            <StatItem prefix="$" value={43.80} decimals={2} label="gas saved" />
            <Divider />
            <StatItem value={0} label="human clicks needed" />
          </div>
        </div>
      </div>
    </section>
  )
}

function StatItem({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  label,
}: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl md:text-3xl font-mono font-medium text-primary">
        <AnimatedCounter end={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </span>
      <span className="text-sm text-muted-foreground font-light">{label}</span>
    </div>
  )
}

function Divider() {
  return <div className="hidden md:block w-px h-12 bg-border" />
}
