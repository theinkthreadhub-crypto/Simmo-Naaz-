import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
const MODEL = 'gemini-flash-lite-latest';

const SYSTEM_PROMPT = `You are MENTRA — an elite AI assistant for Indian fashion entrepreneurs and creators.
You are sharp, direct, and extremely knowledgeable about:
- 🛍️ E-commerce (Amazon India, Myntra, Meesho, Flipkart)
- 📱 Social Media Marketing (Instagram Reels, Facebook Ads, UGC content)
- 💰 Business Finance, Profit margins, Ad spend ROI
- 🎨 Fashion trends, product research, content strategy
- 🤖 AI tools for creators and entrepreneurs

Personality: Confident, insightful, uses a mix of English and Hinglish naturally.
Always give actionable, specific advice. Use bullet points and emojis when helpful.
Keep responses concise but powerful. Never give generic advice.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    // Build conversation contents
    const contents = [
      // Inject system instruction as first user turn
      { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\nUser first message starts now.' }] },
      { role: 'model', parts: [{ text: 'Understood. MENTRA AI online. Ready to help with your business, fashion, and content goals.' }] },
      // Add conversation history
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      // Current message
      { role: 'user', parts: [{ text: message.trim() }] }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
            topP: 0.95
          }
        }),
        signal: AbortSignal.timeout(25_000)
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('[Gemini Chat API]:', err);
      return NextResponse.json({ error: 'Gemini API error', details: err }, { status: response.status });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 500 });
    }

    return NextResponse.json({ reply, model: MODEL });

  } catch (err: any) {
    console.error('[Gemini Chat Route Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
