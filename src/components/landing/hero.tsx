import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative py-20 lg:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Turn one blog post into
          <br />
          <span className="text-primary-600">a week of social content</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          One API call. Five platforms. Zero effort. Transform any article into
          Twitter threads, LinkedIn posts, Instagram captions, and more.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg">Get Free API Key</Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" size="lg">
              View Documentation
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Free tier includes 10 requests/month. No credit card required.
        </p>
      </div>
    </section>
  )
}
