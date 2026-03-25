import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiKeyDisplay } from '@/components/dashboard/api-key-display'
import { UsageMeter } from '@/components/dashboard/usage-meter'
import { TIER_LIMITS, TIER_NAMES } from '@/lib/constants'
import type { SubscriptionTier } from '@/lib/constants'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get API key
  const { data: apiKeyData } = await supabase
    .from('api_keys')
    .select('prefix')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .single()

  // Get usage
  const currentMonth = new Date().toISOString().slice(0, 7)
  const { data: usageData } = await supabase
    .from('usage')
    .select('requests_count')
    .eq('user_id', user.id)
    .eq('month', currentMonth)
    .single()

  const tier = (profile?.subscription_tier || 'free') as SubscriptionTier
  const limit = TIER_LIMITS[tier]
  const used = usageData?.requests_count || 0

  // For demo purposes, show a placeholder key
  const displayKey = apiKeyData?.prefix || 'rp_live_xxxxxxxx...'

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            RepostAI
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/docs" className="text-gray-600 hover:text-gray-900">
              Docs
            </Link>
            <form action="/api/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <ApiKeyDisplay apiKey={displayKey} />
              <p className="text-sm text-gray-500 mt-4">
                Use this key in the Authorization header: <code className="bg-gray-100 px-1">Bearer YOUR_KEY</code>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageMeter used={used} limit={limit} />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Plan: <span className="font-medium">{TIER_NAMES[tier]}</span>
                </span>
                {tier === 'free' && (
                  <Link href="/pricing">
                    <Button size="sm">Upgrade</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X POST https://repostai.vercel.app/api/v1/repurpose \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Your blog post text here..."}'`}
            </pre>
            <Link href="/docs" className="inline-block mt-4 text-primary-600 hover:underline text-sm">
              View full documentation →
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
