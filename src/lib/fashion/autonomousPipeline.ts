import { createClient } from '@/lib/supabase/server';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';
import {
  searchGoogleDrive,
  downloadGoogleDriveFileBase64
} from '@/lib/integrations/google/drive';

interface ProductMetadata {
  title: string;
  price: number;
  category: string;
  tags: string[];
  description: string;
  ugcModelPrompt: string;
}

export interface FashionPipelineInput {
  userId: string;
  imageBase64: string;
  mimeType: string;
  caption?: string;
  sourceJid?: string;
}

export interface FashionPipelineResult {
  success: boolean;
  approvalId?: string;
  productTitle?: string;
  productPrice?: number;
  productDescription?: string;
  mockupUrl?: string;
  ugcModelPrompt?: string;
  instagramCaption?: string;
  message: string;
}

export interface FashionPublishResult {
  success: boolean;
  websitePublished: boolean;
  instagramQueued: boolean;
  message: string;
  errors?: string[];
}

function clampPrice(value: unknown, fallback = 999): number {
  const price = Number(value);
  if (!Number.isFinite(price)) return fallback;
  return Math.max(799, Math.min(1499, Math.round(price)));
}

function normalizeMetadata(
  candidate: Partial<ProductMetadata>,
  fallback: ProductMetadata
): ProductMetadata {
  const allowedCategories = new Set([
    'T-Shirts',
    'Hoodies',
    'Oversized',
    'Sweatshirts'
  ]);

  const tags = Array.isArray(candidate.tags)
    ? candidate.tags
        .map(tag => String(tag).trim())
        .filter(Boolean)
        .slice(0, 8)
    : fallback.tags;

  return {
    title:
      typeof candidate.title === 'string' && candidate.title.trim()
        ? candidate.title.trim().slice(0, 120)
        : fallback.title,
    price: clampPrice(candidate.price, fallback.price),
    category:
      typeof candidate.category === 'string' &&
      allowedCategories.has(candidate.category)
        ? candidate.category
        : fallback.category,
    tags: tags.length > 0 ? tags : fallback.tags,
    description:
      typeof candidate.description === 'string' && candidate.description.trim()
        ? candidate.description.trim().slice(0, 1200)
        : fallback.description,
    ugcModelPrompt:
      typeof candidate.ugcModelPrompt === 'string' &&
      candidate.ugcModelPrompt.trim()
        ? candidate.ugcModelPrompt.trim().slice(0, 2400)
        : fallback.ugcModelPrompt
  };
}

async function analyzeFashionDesign(
  imageBase64: string,
  mimeType: string,
  caption: string
): Promise<ProductMetadata> {
  const fallback: ProductMetadata = {
    title: 'Oversized Streetwear Graphic Tee',
    price: 999,
    category: 'Oversized',
    tags: ['streetwear', 'oversized', 'graphic-tee', 'drop-shoulder', 'cotton'],
    description:
      'Premium 240 GSM combed cotton oversized tee with a bold graphic-led streetwear look. Built for a relaxed drop-shoulder fit and everyday wear.',
    ugcModelPrompt:
      'Photorealistic Indian streetwear model wearing an oversized heavyweight T-shirt with the uploaded artwork reproduced accurately on the garment, urban India after sunset, natural skin texture, candid smartphone-style fashion photography.'
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
  if (!apiKey) return fallback;

  try {
    const promptText = `You are the fashion merchandising assistant for InkThread Hub, an Indian streetwear brand.
Analyze the uploaded artwork and caption "${caption}".
Return ONLY a valid JSON object with:
"title": commercial product title,
"price": INR number from 799 to 1499,
"category": one of "T-Shirts", "Hoodies", "Oversized", "Sweatshirts",
"tags": array of 5 concise search tags,
"description": factual 2-3 sentence product copy. Do not invent fabric facts that are not provided,
"ugcModelPrompt": detailed photorealistic Indian streetwear UGC prompt that preserves the uploaded artwork accurately.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        }),
        signal: AbortSignal.timeout(30_000)
      }
    );

    if (!response.ok) {
      console.warn(
        '[Fashion Analysis]: Gemini request failed',
        response.status,
        (await response.text()).slice(0, 400)
      );
      return fallback;
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return fallback;

    return normalizeMetadata(JSON.parse(raw), fallback);
  } catch (error) {
    console.warn('[Fashion Analysis]: Falling back to deterministic metadata', error);
    return fallback;
  }
}

function buildInstagramCaption(metadata: ProductMetadata): string {
  const hashtags = metadata.tags
    .map(tag => `#${tag.replace(/[^a-zA-Z0-9]/g, '')}`)
    .filter(tag => tag.length > 1)
    .join(' ');

  return `NEW DROP: ${metadata.title}

${metadata.description}

Price: ₹${metadata.price}
Sizes: S to XXL

${hashtags} #InkThreadHub #StreetwearIndia`;
}

async function createFashionApproval(
  userId: string,
  metadata: ProductMetadata,
  instagramCaption: string,
  mockupUrl?: string
): Promise<{ id?: string; error?: string }> {
  return runAsTrustedServer('fashion_pipeline_approval_create', async () => {
    const supabase = createClient();
    const toolInput = {
      title: metadata.title,
      price: metadata.price,
      category: metadata.category,
      tags: metadata.tags,
      description: metadata.description,
      ...(mockupUrl ? { mockupUrl } : {}),
      instagramCaption
    };

    const { data, error } = await supabase
      .from('approval_requests')
      .insert({
        user_id: userId,
        tool_name: 'publishFashionProduct',
        tool_input: toolInput,
        description: `Publish "${metadata.title}" (₹${metadata.price}) to InkThread Hub`,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select('id')
      .single();

    if (error || !data?.id) {
      console.error('[Fashion Approval]: Failed to persist approval', error);
      return {
        error: error?.message || 'APPROVAL_CREATE_FAILED'
      };
    }

    return { id: data.id };
  });
}

export async function processIncomingFashionDesign(
  input: FashionPipelineInput
): Promise<FashionPipelineResult> {
  const {
    userId,
    imageBase64,
    mimeType,
    caption = ''
  } = input;

  if (!imageBase64) {
    return {
      success: false,
      message: 'Design image missing. Please send the artwork image again.'
    };
  }

  const metadata = await analyzeFashionDesign(imageBase64, mimeType, caption);
  const instagramCaption = buildInstagramCaption(metadata);
  const configuredMockupUrl =
    process.env.FASHION_DEFAULT_MOCKUP_URL?.trim() || undefined;

  const approval = await createFashionApproval(
    userId,
    metadata,
    instagramCaption,
    configuredMockupUrl
  );

  if (!approval.id) {
    return {
      success: false,
      productTitle: metadata.title,
      productPrice: metadata.price,
      productDescription: metadata.description,
      ugcModelPrompt: metadata.ugcModelPrompt,
      instagramCaption,
      message:
        'Design analysis complete, but the publish approval could not be saved. Nothing has been published.'
    };
  }

  return {
    success: true,
    approvalId: approval.id,
    productTitle: metadata.title,
    productPrice: metadata.price,
    productDescription: metadata.description,
    mockupUrl: configuredMockupUrl,
    ugcModelPrompt: metadata.ugcModelPrompt,
    instagramCaption,
    message: `✨ *FASHION DROP DRAFT READY*

👕 *Title:* ${metadata.title}
💰 *Price:* ₹${metadata.price} (${metadata.category})
📝 *Description:* ${metadata.description}

📸 *UGC generation prompt ready:*
_${metadata.ugcModelPrompt}_

📱 *Instagram copy ready:*
_${instagramCaption.slice(0, 220)}..._

Nothing is live yet.
👉 Reply *1* to approve website publishing.
👉 Reply *3* to cancel.`
  };
}

export async function fetchDriveDesignAndProcess(
  userId: string,
  query: string = ''
): Promise<FashionPipelineResult> {
  const searchResult = await searchGoogleDrive(userId, query || 'image', 5);

  if (searchResult.error || !searchResult.files?.length) {
    return {
      success: false,
      message:
        searchResult.error === 'CONNECTION_REQUIRED'
          ? 'Google Drive is not connected. Open /connections in MENTRA and connect Google.'
          : `Google Drive mein koi matching design image nahi mili "${query}".`
    };
  }

  const imageFile =
    searchResult.files.find(file => {
      const name = file.name.toLowerCase();
      return (
        file.mimeType?.startsWith('image/') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp')
      );
    }) || searchResult.files[0];

  if (!imageFile.mimeType?.startsWith('image/')) {
    return {
      success: false,
      message: `Drive file "${imageFile.name}" image file nahi hai.`
    };
  }

  const download = await downloadGoogleDriveFileBase64(userId, imageFile.id);
  if (download.error || !download.base64) {
    return {
      success: false,
      message: `Drive image "${imageFile.name}" download nahi ho payi: ${download.error || 'UNKNOWN_ERROR'}`
    };
  }

  return processIncomingFashionDesign({
    userId,
    imageBase64: download.base64,
    mimeType: download.mimeType || imageFile.mimeType || 'image/jpeg',
    caption: `Design from Google Drive: ${imageFile.name}`
  });
}

async function postPublishingWebhook(
  url: string,
  secret: string | undefined,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-mentra-publish-secret': secret } : {})
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25_000)
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        error: `HTTP_${response.status}: ${body.slice(0, 300)}`
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function publishProductToWebsiteAndInstagram(
  product: {
    title: string;
    price: number;
    category?: string;
    description: string;
    tags?: string[];
    mockupUrl?: string;
    instagramCaption?: string;
  }
): Promise<FashionPublishResult> {
  const websiteWebhook = process.env.INKTHREAD_PUBLISH_WEBHOOK_URL?.trim() || '';
  const websiteSecret =
    process.env.INKTHREAD_PUBLISH_WEBHOOK_SECRET?.trim() || undefined;
  const instagramWebhook =
    process.env.INSTAGRAM_PUBLISH_WEBHOOK_URL?.trim() || '';
  const instagramSecret =
    process.env.INSTAGRAM_PUBLISH_WEBHOOK_SECRET?.trim() || undefined;

  const errors: string[] = [];
  let websitePublished = false;
  let instagramQueued = false;

  if (!websiteWebhook) {
    errors.push('INKTHREAD_PUBLISH_WEBHOOK_NOT_CONFIGURED');
  } else {
    const websiteResult = await postPublishingWebhook(
      websiteWebhook,
      websiteSecret,
      {
        source: 'MENTRA',
        product: {
          title: product.title,
          price: product.price,
          category: product.category || 'Oversized',
          description: product.description,
          tags: product.tags || [],
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          ...(product.mockupUrl ? { imageUrl: product.mockupUrl } : {})
        }
      }
    );

    websitePublished = websiteResult.ok;
    if (!websiteResult.ok) {
      errors.push(`WEBSITE_PUBLISH_FAILED: ${websiteResult.error || 'UNKNOWN'}`);
    }
  }

  if (instagramWebhook && product.instagramCaption) {
    const instagramResult = await postPublishingWebhook(
      instagramWebhook,
      instagramSecret,
      {
        source: 'MENTRA',
        caption: product.instagramCaption,
        ...(product.mockupUrl ? { imageUrl: product.mockupUrl } : {})
      }
    );

    instagramQueued = instagramResult.ok;
    if (!instagramResult.ok) {
      errors.push(
        `INSTAGRAM_QUEUE_FAILED: ${instagramResult.error || 'UNKNOWN'}`
      );
    }
  }

  const success = websitePublished;

  if (!success) {
    return {
      success: false,
      websitePublished,
      instagramQueued,
      errors,
      message:
        'Publish approval executed, but InkThread Hub did not confirm a live product. Nothing is being reported as live. Check the publishing integration configuration.'
    };
  }

  return {
    success: true,
    websitePublished,
    instagramQueued,
    ...(errors.length > 0 ? { errors } : {}),
    message: instagramQueued
      ? `✅ "${product.title}" is published on InkThread Hub and the Instagram post was queued.`
      : `✅ "${product.title}" is published on InkThread Hub. Instagram was not queued because no working Instagram publishing integration is configured.`
  };
}
