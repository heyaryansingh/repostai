import { GoogleGenerativeAI } from '@google/generative-ai'

export interface RepurposeInput {
  content: string
  platforms: ('twitter' | 'linkedin' | 'instagram' | 'summary')[]
  tone: 'professional' | 'casual' | 'witty'
}

export interface RepurposeOutput {
  twitter_thread: string[]
  linkedin: string
  instagram: string
  summary: string
  quotes: string[]
}

const SYSTEM_PROMPT = `You are an expert content repurposing assistant. Your job is to take long-form content (blog posts, articles) and transform them into platform-optimized social media content.

Guidelines:
- Twitter threads should be 5-10 tweets, each under 280 characters
- Start Twitter threads with a hook, end with a call to action
- LinkedIn posts should be professional but engaging, with line breaks for readability
- Instagram captions should be engaging with relevant hashtags (5-10 hashtags)
- Summaries should be 2-3 sentences capturing the key insight
- Extract 2-3 memorable quotes from the original content

Always maintain the core message and value of the original content.`

export async function repurposeContent(input: RepurposeInput): Promise<RepurposeOutput> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const { content, platforms, tone } = input

  const toneInstructions: Record<string, string> = {
    professional: 'Use a professional, authoritative tone.',
    casual: 'Use a casual, conversational tone.',
    witty: 'Use a witty, clever tone with subtle humor.',
  }

  const platformInstructions = platforms.map(p => {
    switch (p) {
      case 'twitter':
        return 'Create a Twitter thread (5-10 tweets, each under 280 chars)'
      case 'linkedin':
        return 'Create a LinkedIn post (professional, with line breaks)'
      case 'instagram':
        return 'Create an Instagram caption (engaging, with 5-10 hashtags)'
      case 'summary':
        return 'Create a 2-3 sentence summary'
      default:
        return ''
    }
  }).join('\n')

  const prompt = `${SYSTEM_PROMPT}

${toneInstructions[tone]}

Please repurpose the following content:

---
${content}
---

Create the following:
${platformInstructions}
Also extract 2-3 memorable quotes from the content.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "twitter_thread": ["tweet 1", "tweet 2", ...],
  "linkedin": "linkedin post content",
  "instagram": "instagram caption with #hashtags",
  "summary": "2-3 sentence summary",
  "quotes": ["quote 1", "quote 2"]
}`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  // Clean up the response - remove markdown code blocks if present
  let cleanedText = text.trim()
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.slice(7)
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.slice(3)
  }
  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(0, -3)
  }
  cleanedText = cleanedText.trim()

  const parsed = JSON.parse(cleanedText)

  return {
    twitter_thread: parsed.twitter_thread || [],
    linkedin: parsed.linkedin || '',
    instagram: parsed.instagram || '',
    summary: parsed.summary || '',
    quotes: parsed.quotes || [],
  }
}
