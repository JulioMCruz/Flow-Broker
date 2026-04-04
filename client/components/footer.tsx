import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-1 text-xl font-medium">
            <span className="text-foreground">Flow</span>
            <span className="text-primary">Broker</span>
          </div>

          {/* Tagline */}
          <div className="text-sm text-muted-foreground">
            Payment orchestration for AI agents
          </div>

          {/* Event */}
          <div className="text-sm text-muted-foreground">
            ETHGlobal Cannes 2026
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 pt-8 border-t border-border flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/find-your-broker" className="hover:text-primary transition-colors">Find Your Broker</Link>
          <Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
        </div>
      </div>
    </footer>
  )
}
