import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_CLOUD_API_KEY
    if (!apiKey) {
      console.warn('Neither GEMINI_API_KEY nor GOOGLE_CLOUD_API_KEY is configured.')
      return NextResponse.json({ quotes: [], fallback: true, personalized: false })
    }

    // Fetch only content and mood columns of the last 3 entries for high performance
    const { data: entries } = await supabase
      .from('entries')
      .select('content, mood')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    let prompt = `You are a compassionate, thoughtful, and poetic AI assistant. 
Your task is to generate exactly 10 unique, short, beautiful, and deeply encouraging daily quotes (maximum 15 words per quote) for the user's personal notebook dashboard. 
The quotes should be highly comforting, warm, and poetic, helping the user reflect, feel validated, and find peace.

`

    const hasEntries = entries && entries.length > 0
    if (hasEntries) {
      prompt += `Here are snippets and moods from the user's recent journal entries for context on their current mental state, thoughts, or feelings:
`
      entries.forEach((e, idx) => {
        // Keep snippet very small to minimize prompt token count and optimize speed
        const contentSnippet = e.content ? e.content.substring(0, 200).replace(/\s+/g, ' ') : ''
        prompt += `- Entry ${idx + 1} (Mood: ${e.mood || 'neutral'}): "${contentSnippet}"\n`
      })
      prompt += `
Use this context to tailor the quotes to their current life theme and emotional journey. 
If their recent journal entries are written in Vietnamese, generate the quotes in Vietnamese. If they are in English, generate in English. Otherwise, default to Vietnamese.
`
    } else {
      prompt += `Since the user hasn't written any journal entries yet, generate a generic set of beautiful, uplifting daily quotes in Vietnamese.
`
    }

    prompt += `
Each quote must have:
1. "quote": The quote text itself (must be concise, maximum 15 words, poetic, and comforting).
2. "theme": A short, single-word theme/category in English (e.g., 'Healing', 'Growth', 'Comfort', 'Mindfulness', 'Strength').
3. "author": "Morrow" or the name of a famous writer/philosopher if applicable.

Return ONLY a JSON object matching this schema:
{
  "quotes": [
    {
      "quote": "Quote text goes here...",
      "theme": "Theme in English",
      "author": "Morrow"
    }
  ]
}
Do not include any markdown code blocks, backticks, or extra text. Output raw JSON only.`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              quotes: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    quote: { type: 'STRING' },
                    theme: { type: 'STRING' },
                    author: { type: 'STRING' },
                  },
                  required: ['quote', 'theme'],
                },
              },
            },
            required: ['quotes'],
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error('Empty response from Gemini API')
    }

    const parsed = JSON.parse(text)
    return NextResponse.json({
      quotes: parsed.quotes || [],
      personalized: hasEntries,
      fallback: false,
    })
  } catch (error) {
    console.error('Error generating daily quotes:', error)
    return NextResponse.json({
      quotes: [],
      fallback: true,
      personalized: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
