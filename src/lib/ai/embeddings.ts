export type EmbeddingPurpose = 'QUERY' | 'DOCUMENT';

export interface EmbeddingResult {
  values: number[];
  model: string;
  tokenCount: number;
}

const EMBEDDING_DIMENSIONS = 768;

function getEmbeddingModel(): string {
  return process.env.AI_EMBEDDING_MODEL || 'gemini-embedding-2';
}

function getEmbeddingApiKey(): string {
  return process.env.AI_EMBEDDING_API_KEY
    || process.env.AI_API_KEY
    || process.env.AI_PROVIDER_API_KEY
    || '';
}

function prepareEmbeddingText(text: string, purpose: EmbeddingPurpose): string {
  const compact = text.replace(/\s+/g, ' ').trim().slice(0, 24000);
  if (purpose === 'QUERY') {
    return `Retrieval query: ${compact}`;
  }
  return `Retrieval document: ${compact}`;
}

export async function generateEmbedding(
  text: string,
  purpose: EmbeddingPurpose = 'QUERY'
): Promise<EmbeddingResult | null> {
  const apiKey = getEmbeddingApiKey();
  if (!apiKey || !text.trim()) return null;

  const model = getEmbeddingModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        model: `models/${model}`,
        content: {
          parts: [{ text: prepareEmbeddingText(text, purpose) }]
        },
        embedContentConfig: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
          autoTruncate: true
        }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn('[MEMORY EMBEDDING]: Gemini embedding request failed', response.status, body.slice(0, 400));
      return null;
    }

    const data = await response.json();
    const values = data?.embedding?.values;

    if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
      console.warn('[MEMORY EMBEDDING]: Unexpected embedding shape', Array.isArray(values) ? values.length : 'missing');
      return null;
    }

    return {
      values: values.map((value: unknown) => Number(value)),
      model,
      tokenCount: Number(data?.usageMetadata?.promptTokenCount || 0)
    };
  } catch (error) {
    console.warn('[MEMORY EMBEDDING]: Request exception', error);
    return null;
  }
}

export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIMENSIONS;
}
