import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-xl font-bold text-gray-900">RepostAI</div>
          <nav className="flex gap-6">
            <Link href="/docs" className="text-gray-600 hover:text-gray-900">
              Docs
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/terms" className="text-gray-600 hover:text-gray-900">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
              Privacy
            </Link>
          </nav>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} RepostAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
