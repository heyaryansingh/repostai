import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    requests: '10',
    description: 'Perfect for trying out the API',
    features: ['10 requests/month', 'All platforms', 'Standard support'],
    cta: 'Get Started',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$19',
    requests: '100',
    description: 'For individual developers',
    features: ['100 requests/month', 'All platforms', 'Priority support'],
    cta: 'Start Free Trial',
    href: '/signup?plan=starter',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    requests: '500',
    description: 'For small teams and agencies',
    features: ['500 requests/month', 'All platforms', 'Priority support', 'Bulk operations'],
    cta: 'Start Free Trial',
    href: '/signup?plan=pro',
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '$99',
    requests: '2000',
    description: 'For high-volume users',
    features: ['2000 requests/month', 'All platforms', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact Sales',
    href: '/signup?plan=scale',
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section className="py-20 bg-gray-50" id="pricing">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-center text-gray-600">
          Start free, upgrade when you need more
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlighted ? 'border-primary-500 ring-2 ring-primary-500' : ''}
            >
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.price !== '$0' && (
                    <span className="text-gray-500">/month</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">{tier.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm">
                      <svg
                        className="mr-2 h-4 w-4 text-primary-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={tier.href} className="w-full">
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? 'primary' : 'outline'}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
