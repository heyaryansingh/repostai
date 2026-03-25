import Link from 'next/link'
import { PricingSection } from '@/components/landing/pricing-section'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            RepostAI
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/docs" className="text-gray-600 hover:text-gray-900">
              Docs
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get API Key</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="py-12">
        <h1 className="text-4xl font-bold text-center text-gray-900">Pricing</h1>
        <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto px-4">
          Start free with 10 requests per month. Upgrade anytime as your needs grow.
        </p>
      </div>

      <PricingSection />
      <Footer />
    </main>
  )
}
