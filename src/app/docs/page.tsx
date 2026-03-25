import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            RepostAI
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">Log in</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Documentation</h1>

        <section className="prose prose-gray max-w-none">
          <h2>Quick Start</h2>
          <p>Get your first repurposed content in 2 minutes.</p>

          <h3>1. Get your API key</h3>
          <p>
            <Link href="/signup" className="text-primary-600 hover:underline">Sign up</Link> and copy your API key from the dashboard.
          </p>

          <h3>2. Make your first request</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`curl -X POST https://repostai.vercel.app/api/v1/repurpose \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Your blog post text here..."}'`}
          </pre>

          <h3>3. Response</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "id": "rp_abc123",
  "twitter_thread": [
    "1/ Your first tweet...",
    "2/ Second tweet..."
  ],
  "linkedin": "Your LinkedIn post...",
  "instagram": "Caption with #hashtags",
  "summary": "A brief summary...",
  "quotes": ["Quote 1", "Quote 2"],
  "usage": {
    "requests_used": 1,
    "requests_limit": 10
  }
}`}
          </pre>

          <h2 className="mt-12">Authentication</h2>
          <p>
            All API requests require authentication via an API key. Include your key in the
            <code className="bg-gray-100 px-1 mx-1">Authorization</code> header:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
{`Authorization: Bearer rp_live_your_api_key`}
          </pre>

          <h2 className="mt-12">Endpoints</h2>

          <h3>POST /api/v1/repurpose</h3>
          <p>Transform content into social media posts.</p>

          <h4>Request Body</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Parameter</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Required</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2"><code>content</code></td>
                  <td>string</td>
                  <td>Yes</td>
                  <td>The content to repurpose (100-50,000 chars)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><code>platforms</code></td>
                  <td>array</td>
                  <td>No</td>
                  <td>[&quot;twitter&quot;, &quot;linkedin&quot;, &quot;instagram&quot;, &quot;summary&quot;]</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2"><code>tone</code></td>
                  <td>string</td>
                  <td>No</td>
                  <td>&quot;professional&quot; | &quot;casual&quot; | &quot;witty&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-8">GET /api/v1/usage</h3>
          <p>Check your current usage and limits.</p>

          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
{`{
  "tier": "free",
  "requests_used": 5,
  "requests_limit": 10,
  "billing_period": "2024-01"
}`}
          </pre>

          <h2 className="mt-12">Rate Limits</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Plan</th>
                  <th className="text-left py-2">Requests/Month</th>
                  <th className="text-left py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-2">Free</td><td>10</td><td>$0</td></tr>
                <tr className="border-b"><td className="py-2">Starter</td><td>100</td><td>$19/mo</td></tr>
                <tr className="border-b"><td className="py-2">Pro</td><td>500</td><td>$49/mo</td></tr>
                <tr className="border-b"><td className="py-2">Scale</td><td>2,000</td><td>$99/mo</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="mt-12">Error Codes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Code</th>
                  <th className="text-left py-2">HTTP</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-2"><code>invalid_api_key</code></td><td>401</td><td>Invalid or revoked API key</td></tr>
                <tr className="border-b"><td className="py-2"><code>rate_limit_exceeded</code></td><td>429</td><td>Monthly limit reached</td></tr>
                <tr className="border-b"><td className="py-2"><code>content_too_short</code></td><td>400</td><td>Content under 100 characters</td></tr>
                <tr className="border-b"><td className="py-2"><code>content_too_long</code></td><td>400</td><td>Content over 50,000 characters</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="mt-12">Code Examples</h2>

          <h3>JavaScript (fetch)</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`const response = await fetch('https://repostai.vercel.app/api/v1/repurpose', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: 'Your blog post text here...',
    platforms: ['twitter', 'linkedin'],
    tone: 'professional'
  })
});

const data = await response.json();
console.log(data.twitter_thread);`}
          </pre>

          <h3>Python</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`import requests

response = requests.post(
    'https://repostai.vercel.app/api/v1/repurpose',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'content': 'Your blog post text here...',
        'platforms': ['twitter', 'linkedin'],
        'tone': 'professional'
    }
)

data = response.json()
print(data['twitter_thread'])`}
          </pre>
        </section>
      </div>
    </main>
  )
}
