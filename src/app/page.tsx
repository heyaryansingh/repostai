import Link from 'next/link'
import { Hero } from '@/components/landing/hero'
import { PricingSection } from '@/components/landing/pricing-section'
import { Footer } from '@/components/landing/footer'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            RepostAI
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/docs" className="text-gray-600 hover:text-gray-900">
              Docs
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
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

      <Hero />

      {/* Demo Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            See it in action
          </h2>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Input: Your blog post</h3>
              <div className="bg-white rounded-lg p-4 text-sm text-gray-600 border">
                <p className="line-clamp-6">
                  &quot;The most successful startups share a common trait: they solve real problems.
                  Not imagined problems, not problems that only exist in the founder&apos;s mind,
                  but genuine pain points that real people experience every day...&quot;
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Output: Ready-to-post content</h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 text-sm border">
                  <span className="text-xs font-medium text-blue-500">Twitter Thread</span>
                  <p className="mt-1 text-gray-600">1/ What separates successful startups from failures? One thing: solving REAL problems...</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-sm border">
                  <span className="text-xs font-medium text-blue-700">LinkedIn</span>
                  <p className="mt-1 text-gray-600">I&apos;ve been thinking about what makes startups succeed...</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-sm border">
                  <span className="text-xs font-medium text-pink-500">Instagram</span>
                  <p className="mt-1 text-gray-600">The secret to startup success? Solve REAL problems. #startup #entrepreneur</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />
      <Footer />
    </main>
  )
}
