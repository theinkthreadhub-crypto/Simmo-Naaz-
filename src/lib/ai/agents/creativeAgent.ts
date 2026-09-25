import { BrandProfile, Campaign, Product } from '@/lib/db/business';

export interface GeneratedContentPack {
  reel: {
    hook: string;
    script: string;
    caption: string;
    hashtags: string[];
  };
  carousel: {
    hook: string;
    slides: Array<{ slideNumber: number; headline: string; visualDescription: string; bodyCopy: string }>;
    caption: string;
  };
  adCreative: {
    hook: string;
    primaryText: string;
    headline: string;
    cta: string;
    visualDirection: string;
  };
  creativeBrief: {
    objective: string;
    hookDescription: string;
    sceneDirection: string;
    visualTone: string;
    assetsRequired: string[];
  };
}

/**
 * Generates a cohesive multi-platform creator campaign pack from brand profile and product details.
 */
export function generateCampaignContentPack(
  brand: BrandProfile,
  campaign: Campaign,
  product?: Product
): GeneratedContentPack {
  const prodName = product?.name || 'Heavyweight Oversized Tee';
  const prodPrice = product?.price ? `₹${product.price}` : '₹599';
  const brandName = brand.tagline ? 'InkThread Hub' : 'Brand';

  return {
    reel: {
      hook: 'Stop buying flimsy oversized tees that lose shape after one wash.',
      script: `[0-3s]: Fast transition zooming into collar and thick fabric texture.\n[3-7s]: Model styling ${prodName} with dark cargos and chunky sneakers.\n[7-12s]: Text overlay "280 GSM Pure Combed Cotton • Drop Shoulder Cut".\n[12-15s]: Fast walk towards camera with brand tag visible.\n[Audio/VO]: "If you want that structured streetwear drape, this is the one."`,
      caption: `That heavyweight drape hits different. 🔥\n\nCrafted with 280 GSM pure combed cotton for that effortless structured streetwear silhouette. Limited initial drop available now at ${prodPrice}.\n\nTap the link in bio to shop before sizes sell out.`,
      hashtags: ['#streetwearindia', '#oversizedtee', '#indianstreetwear', '#dropfit', '#inkthreadhub']
    },
    carousel: {
      hook: 'How to style an oversized drop like a streetwear creative 🛹',
      slides: [
        { slideNumber: 1, headline: 'The Silhouette Rule', visualDescription: 'Wide angle photo of the model wearing the tee with baggy parachute pants', bodyCopy: 'Balance the volume: heavyweight top + relaxed structured bottoms.' },
        { slideNumber: 2, headline: 'Fabric Matters', visualDescription: 'Close-up macro shot of the 280 GSM cotton rib collar', bodyCopy: 'Never settle for thin fabric. You want thick ribbing that holds its collar shape all day.' },
        { slideNumber: 3, headline: 'Color Coordination', visualDescription: 'Flatlay outfit grid with accessories and silver chain', bodyCopy: 'Pair washed onyx and earth tones with subtle metallic accents.' },
        { slideNumber: 4, headline: 'The Drop Is Live', visualDescription: 'Bold studio shot with price tag and website URL', bodyCopy: `Available now on inkthreadhub.com for ${prodPrice}.` }
      ],
      caption: `Save this for your next outfit rotation! Which slide is your favorite fit? Let us know below. 👇`
    },
    adCreative: {
      hook: 'Tired of oversized tees that look like pyjamas?',
      primaryText: `Get the structured, premium streetwear fit you've been looking for. Made in India with heavyweight 280 GSM cotton that drapes clean and keeps its shape.`,
      headline: `${prodName} — Limited Drop Live`,
      cta: 'Shop Now',
      visualDirection: 'Gritty street aesthetic, moody lighting, model moving naturally in urban setting'
    },
    creativeBrief: {
      objective: `Drive direct sales and awareness for ${campaign.name}`,
      hookDescription: 'Immediate visual proof of thick collar and heavy drape in first 2 seconds',
      sceneDirection: 'Street sidewalk, raw concrete background, high-contrast natural lighting',
      visualTone: brand.visualDirection || 'Dark aesthetic, bold urban typography',
      assetsRequired: ['1 Reel Video (9:16)', '4 Carousel Slides (4:5)', '2 Ad Still Graphics (1:1)']
    }
  };
}
