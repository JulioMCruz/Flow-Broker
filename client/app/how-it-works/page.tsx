import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { PaymentFlowSection } from "@/components/how-it-works/payment-flow-section"
import { TechnologySection } from "@/components/how-it-works/technology-section"
import { FaqSection } from "@/components/how-it-works/faq-section"

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground text-balance">
            How FlowBroker <span className="font-serif italic text-primary">works</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground font-light">
            Every step, every payment, every decision.
          </p>
        </div>
      </section>

      <PaymentFlowSection />
      <TechnologySection />
      <FaqSection />

      <Footer />
    </main>
  )
}
