import { createClient } from '@/lib/supabase/server';
import { runAsTrustedServer } from '@/lib/supabase/trustedScope';
import { executeMetaSuiteWorkflow } from '@/lib/integrations/meta/metaPublisher';

export interface UGCGenerationInput {
  userId: string;
  productTitle: string;
  productPrice: number;
  productUrl?: string;
  platform?: string;
  category?: string;
  customInstructions?: string;
}

export interface UGCGenerationResult {
  success: boolean;
  approvalId?: string;
  productTitle: string;
  productPrice: number;
  ugcModelPrompt: string;
  imageUrl?: string;
  instagramCaption: string;
  facebookCaption: string;
  message: string;
}

export interface SocialPublishInput {
  productTitle: string;
  price: number;
  imageUrl?: string;
  instagramCaption: string;
  facebookCaption?: string;
  productUrl?: string;
}

export interface SocialPublishResult {
  success: boolean;
  instagramPublished: boolean;
  facebookPublished: boolean;
  postIds?: { instagram?: string; facebook?: string };
  message: string;
  errors?: string[];
}

/**
 * Generate Hyper-Realistic UGC Model Image using Google Gemini Imagen 3
 */
export async function generateGeminiUGCImage(
  prompt: string,
  apiKey: string
): Promise<string | undefined> {
  if (!apiKey) return undefined;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '4:5',
          outputMimeType: 'image/jpeg',
          personGeneration: 'ALLOW_ADULT'
        }
      }),
      signal: AbortSignal.timeout(30_000)
    });

    if (response.ok) {
      const data = await response.json();
      const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
      if (b64) {
        return `data:image/jpeg;base64,${b64}`;
      }
    } else {
      console.warn('[Gemini Imagen 3]: Non-OK response', response.status);
    }
  } catch (error) {
    console.warn('[Gemini Imagen 3]: Generation fallback', error);
  }

  return undefined;
}

/**
 * Generate viral Instagram & Facebook caption + UGC prompt using Gemini AI
 */
export async function generateUGCContent(
  input: UGCGenerationInput
): Promise<UGCGenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
  
  const fallbackPrompt = `Hyper-realistic candid smartphone photography of a 22-year-old stylish Indian model wearing/showcasing "${input.productTitle}". Natural sunlit aesthetics, modern urban cafe background in Bandra Mumbai, ultra-detailed fabric texture, 8k resolution UGC Instagram reel aesthetic.`;
  const fallbackIgCaption = `Obsessed with this new find! ✨\n\n${input.productTitle}\n💰 Price: ₹${input.productPrice}\n\nComment 'LINK' or check link in bio to grab yours! 🔥\n\n#FashionIndia #OOTD #AestheticFashion #TrendingStyles #UGCFashion #ViralFinds`;
  const fallbackFbCaption = `Looking for the best ${input.category || 'fashion'} picks? Check out ${input.productTitle} at just ₹${input.productPrice}!\n\nShop now: ${input.productUrl || 'Link in bio'}`;

  let ugcModelPrompt = fallbackPrompt;
  let instagramCaption = fallbackIgCaption;
  let facebookCaption = fallbackFbCaption;

  if (apiKey) {
    try {
      const promptText = `You are a top-tier viral Social Media & UGC Creator for Indian E-Commerce.
Product Title: "${input.productTitle}"
Price: ₹${input.productPrice}
Category: "${input.category || 'Fashion'}"
Product Link: "${input.productUrl || ''}"
Special Notes: "${input.customInstructions || 'Create high-converting UGC model prompt and viral captions'}"

Generate a JSON object with:
1. "ugcModelPrompt": A detailed prompt for Google Gemini Imagen 3 to generate a realistic young Indian fashion model wearing or showcasing this product in a natural lifestyle setting (shot on iPhone 15 Pro, candid lighting, authentic skin texture).
2. "instagramCaption": Engaging viral Hinglish caption with hook, emojis, pricing, clear call to action ("Comment 'BUY' for instant DM link" / "Link in bio"), and 15 curated trending hashtags.
3. "facebookCaption": Persuasive Facebook post copy with benefits, pricing, and direct link CTA.

Return ONLY a valid JSON object.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
          signal: AbortSignal.timeout(20_000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.ugcModelPrompt) ugcModelPrompt = parsed.ugcModelPrompt;
          if (parsed.instagramCaption) instagramCaption = parsed.instagramCaption;
          if (parsed.facebookCaption) facebookCaption = parsed.facebookCaption;
        }
      }
    } catch (e) {
      console.warn('[UGC Generator]: Using fallback captions and prompt', e);
    }
  }

  // 1. Generate image using Google Gemini Imagen 3
  let generatedImageUrl = await generateGeminiUGCImage(ugcModelPrompt, apiKey);

  if (!generatedImageUrl) {
    // Graceful high-resolution aesthetic fashion image fallback
    generatedImageUrl = `https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1080&auto=format&fit=crop&q=80`;
  }

  // 2. Create Approval Request in Mentra database
  const approval = await runAsTrustedServer('ugc_social_approval_create', async () => {
    const supabase = createClient();
    const toolInput = {
      productTitle: input.productTitle,
      price: input.productPrice,
      imageUrl: generatedImageUrl,
      instagramCaption,
      facebookCaption,
      productUrl: input.productUrl
    };

    const { data, error } = await supabase
      .from('approval_requests')
      .insert({
        user_id: input.userId,
        tool_name: 'publishToSocialMedia',
        tool_input: toolInput,
        description: `Publish UGC Post for "${input.productTitle}" (₹${input.productPrice}) to Instagram & Facebook`,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select('id')
      .single();

    if (error || !data?.id) {
      console.error('[UGC Approval]: Could not persist approval', error);
      return { id: undefined };
    }
    return { id: data.id };
  });

  let messageText = `📸 *GOOGLE GEMINI AI UGC MODEL & SOCIAL POST READY!*\n`;
  messageText += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  messageText += `👕 *Product:* ${input.productTitle}\n`;
  messageText += `💰 *Price:* ₹${input.productPrice}\n`;
  messageText += `🖼️ *Generated Model:* ${generatedImageUrl.startsWith('data:') ? '[Gemini Imagen 3 High-Res Image Ready]' : generatedImageUrl}\n\n`;
  messageText += `📱 *Instagram Caption Preview:*\n_${instagramCaption.slice(0, 200)}..._\n\n`;
  messageText += `━━━━━━━━━━━━━━━━━━━━━\n`;
  messageText += `👉 Reply *'APPROVE ${approval.id}'* or *'1'* to automatically post to Instagram & Facebook!\n`;
  messageText += `👉 Reply *'REJECT'* to cancel.`;

  return {
    success: true,
    approvalId: approval.id,
    productTitle: input.productTitle,
    productPrice: input.productPrice,
    ugcModelPrompt,
    imageUrl: generatedImageUrl,
    instagramCaption,
    facebookCaption,
    message: messageText
  };
}

/**
 * Publish approved UGC post to Instagram & Facebook
 */
export async function publishToSocialMedia(
  input: SocialPublishInput
): Promise<SocialPublishResult> {
  if (!input.imageUrl) {
    return {
      success: false,
      instagramPublished: false,
      facebookPublished: false,
      message: 'Image URL is required for Meta Business Suite publishing.'
    };
  }

  const result = await executeMetaSuiteWorkflow({
    imageUrl: input.imageUrl,
    instagramCaption: input.instagramCaption,
    facebookCaption: input.facebookCaption,
    linkUrl: input.productUrl
  });

  return {
    success: result.success,
    instagramPublished: Boolean(result.instagram?.published),
    facebookPublished: Boolean(result.facebook?.published),
    postIds: {
      instagram: result.instagram?.postId,
      facebook: result.facebook?.postId
    },
    errors: result.errors,
    message: result.summary
  };
}
