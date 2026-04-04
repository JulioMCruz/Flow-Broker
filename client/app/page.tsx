import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { ComparisonSection } from "@/components/landing/comparison-section"
import { IntelligenceSection } from "@/components/landing/intelligence-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { WhoItsForSection } from "@/components/landing/who-its-for-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <HowItWorksSection />
      <ComparisonSection />
      <IntelligenceSection />
      <PricingSection />
      <WhoItsForSection />
      <Footer />
    </main>
  )
}
