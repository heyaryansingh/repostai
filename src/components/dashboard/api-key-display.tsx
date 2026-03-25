'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ApiKeyDisplayProps {
  apiKey: string
}

export function ApiKeyDisplay({ apiKey }: ApiKeyDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayKey = revealed ? apiKey : apiKey.replace(/(.{12}).*/, '$1' + '\u2022'.repeat(32))

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <code className="text-sm font-mono text-gray-800 break-all">
          {displayKey}
        </code>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevealed(!revealed)}
          >
            {revealed ? 'Hide' : 'Reveal'}
          </Button>
          <Button size="sm" onClick={copyToClipboard}>
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>
    </div>
  )
}
