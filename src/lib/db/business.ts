import { createClient } from '@/lib/supabase/server';

export interface Business {
  id: string;
  userId: string;
  name: string;
  description?: string;
  industry?: string;
  businessType: 'E_COMMERCE' | 'CREATOR' | 'AGENCY' | 'SAAS' | 'SERVICE';
  website?: string;
  primaryMarket: string;
  targetAudience?: string;
  brandVoice: string;
  currency: string;
  timezone: string;
  primaryGoal?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  createdAt: string;
}

export interface BrandProfile {
  id: string;
  businessId: string;
  userId: string;
  tagline?: string;
  positioning?: string;
  visualDirection?: string;
  contentStyle?: string;
  doNotUse: string[];
  preferredChannels: string[];
  productCategories: string[];
  pricePositioning: 'BUDGET' | 'MID_TIER' | 'PREMIUM' | 'LUXURY';
  coreMessages: string[];
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  userId: string;
  name: string;
  category?: string;
  sku?: string;
  price: number;
  cost: number;
  margin: number;
  status: 'IDEA' | 'DEVELOPMENT' | 'READY' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
  description?: string;
  imageUrl?: string;
  websiteUrl?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  businessId: string;
  userId: string;
  name: string;
  objective: 'PRODUCT_LAUNCH' | 'SALES' | 'AWARENESS' | 'GROWTH' | 'RETARGETING';
  audience?: string;
  offer?: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  spent: number;
  channels: string[];
  status: 'DRAFT' | 'PLANNED' | 'READY' | 'ACTIVE' | 'PAUSED' | 'COMPLETE' | 'CANCELLED';
  goalId?: string;
  projectId?: string;
  createdAt: string;
}

export interface ResearchOpportunity {
  id: string;
  businessId: string;
  userId: string;
  title: string;
  category: 'MARKET_TREND' | 'COMPETITOR_GAP' | 'PRODUCT_CONCEPT' | 'AUDIENCE_NEED';
  evidence: string;
  targetAudience?: string;
  suggestedExperiment?: string;
  status: 'NEW' | 'VALIDATING' | 'ACCEPTED' | 'REJECTED' | 'TESTING' | 'PROVEN';
  createdAt: string;
}

export interface BusinessExperiment {
  id: string;
  businessId: string;
  userId: string;
  title: string;
  hypothesis: string;
  variantA: string;
  variantB: string;
  metric: string;
  status: 'DRAFT' | 'RUNNING' | 'CONCLUDED';
  resultSummary?: string;
  createdAt: string;
}

const memBusinesses = new Map<string, Business>();
const memBrandProfiles = new Map<string, BrandProfile>();
const memProducts = new Map<string, Product>();
const memCampaigns = new Map<string, Campaign>();
const memOpportunities = new Map<string, ResearchOpportunity>();
const memExperiments = new Map<string, BusinessExperiment>();

export async function createBusiness(
  userId: string,
  data: {
    name: string;
    description?: string;
    industry?: string;
    businessType?: 'E_COMMERCE' | 'CREATOR' | 'AGENCY' | 'SAAS' | 'SERVICE';
    website?: string;
    primaryMarket?: string;
    targetAudience?: string;
    brandVoice?: string;
    primaryGoal?: string;
  }
): Promise<Business> {
  const id = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const biz: Business = {
    id,
    userId,
    name: data.name,
    description: data.description || '',
    industry: data.industry || 'Fashion & Apparel',
    businessType: data.businessType || 'E_COMMERCE',
    website: data.website || '',
    primaryMarket: data.primaryMarket || 'India',
    targetAudience: data.targetAudience || 'Youth & Streetwear enthusiasts',
    brandVoice: data.brandVoice || 'Direct, Modern, Relatable',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    primaryGoal: data.primaryGoal || '₹1L Monthly Direct Sales',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  memBusinesses.set(id, biz);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('businesses').insert({
        id,
        user_id: userId,
        name: biz.name,
        description: biz.description,
        industry: biz.industry,
        business_type: biz.businessType,
        website: biz.website,
        primary_market: biz.primaryMarket,
        target_audience: biz.targetAudience,
        brand_voice: biz.brandVoice,
        currency: biz.currency,
        timezone: biz.timezone,
        primary_goal: biz.primaryGoal,
        status: biz.status,
        created_at: biz.createdAt
      })
    ).catch(() => {});
  } catch {
    // In-memory fallback
  }

  return biz;
}

export async function getUserBusinesses(userId: string): Promise<Business[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        name: d.name,
        description: d.description,
        industry: d.industry,
        businessType: d.business_type,
        website: d.website,
        primaryMarket: d.primary_market,
        targetAudience: d.target_audience,
        brandVoice: d.brand_voice,
        currency: d.currency,
        timezone: d.timezone,
        primaryGoal: d.primary_goal,
        status: d.status,
        createdAt: d.created_at
      }));
    }
  } catch {
    // Fallback
  }

  const list: Business[] = [];
  memBusinesses.forEach(b => {
    if (b.userId === userId && b.status === 'ACTIVE') list.push(b);
  });
  return list;
}

export async function getActiveBusiness(userId: string): Promise<Business | null> {
  const businesses = await getUserBusinesses(userId);
  return businesses.length > 0 ? businesses[0] : null;
}

export async function updateBrandProfile(
  userId: string,
  businessId: string,
  profile: Partial<BrandProfile>
): Promise<BrandProfile> {
  const id = `bp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const brandProfile: BrandProfile = {
    id,
    businessId,
    userId,
    tagline: profile.tagline || 'Modern Streetwear for Indian Youth',
    positioning: profile.positioning || 'Aspirational yet accessible oversized heavyweight apparel',
    visualDirection: profile.visualDirection || 'Dark aesthetic, gritty urban typography, bold graphics',
    contentStyle: profile.contentStyle || 'High-energy reels, outfit transitions, street culture showcase',
    doNotUse: profile.doNotUse || ['Cliches', 'Cheap discount spam', 'Over-polished studio stock imagery'],
    preferredChannels: profile.preferredChannels || ['INSTAGRAM', 'WHATSAPP', 'WEBSITE'],
    productCategories: profile.productCategories || ['Oversized Tees', 'Hoodies', 'Cargo Pants'],
    pricePositioning: profile.pricePositioning || 'MID_TIER',
    coreMessages: profile.coreMessages || ['Wear Your Vibe', 'Heavyweight 280 GSM Cotton'],
    createdAt: new Date().toISOString()
  };

  memBrandProfiles.set(businessId, brandProfile);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('brand_profiles').upsert({
        id,
        business_id: businessId,
        user_id: userId,
        tagline: brandProfile.tagline,
        positioning: brandProfile.positioning,
        visual_direction: brandProfile.visualDirection,
        content_style: brandProfile.contentStyle,
        do_not_use: brandProfile.doNotUse,
        preferred_channels: brandProfile.preferredChannels,
        product_categories: brandProfile.productCategories,
        price_positioning: brandProfile.pricePositioning,
        core_messages: brandProfile.coreMessages,
        created_at: brandProfile.createdAt
      }, { onConflict: 'business_id' })
    ).catch(() => {});
  } catch {
    // Fallback
  }

  return brandProfile;
}

export async function getBrandProfile(businessId: string): Promise<BrandProfile | null> {
  const mem = memBrandProfiles.get(businessId);
  if (mem) return mem;

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (!data) return null;
    return {
      id: data.id,
      businessId: data.business_id,
      userId: data.user_id,
      tagline: data.tagline,
      positioning: data.positioning,
      visualDirection: data.visual_direction,
      contentStyle: data.content_style,
      doNotUse: data.do_not_use || [],
      preferredChannels: data.preferred_channels || [],
      productCategories: data.product_categories || [],
      pricePositioning: data.price_positioning,
      coreMessages: data.core_messages || [],
      createdAt: data.created_at
    };
  } catch {
    return null;
  }
}

export async function createProduct(
  userId: string,
  product: {
    businessId: string;
    name: string;
    category?: string;
    sku?: string;
    price: number;
    cost?: number;
    status?: 'IDEA' | 'DEVELOPMENT' | 'READY' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
    description?: string;
    imageUrl?: string;
    websiteUrl?: string;
  }
): Promise<Product> {
  const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cost = product.cost || 0;
  const price = product.price || 0;
  const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : 0;

  const newProd: Product = {
    id,
    businessId: product.businessId,
    userId,
    name: product.name,
    category: product.category || 'Apparel',
    sku: product.sku || `SKU-${Date.now().toString().slice(-4)}`,
    price,
    cost,
    margin,
    status: product.status || 'ACTIVE',
    description: product.description || '',
    imageUrl: product.imageUrl,
    websiteUrl: product.websiteUrl,
    createdAt: new Date().toISOString()
  };

  memProducts.set(id, newProd);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('products').insert({
        id,
        business_id: newProd.businessId,
        user_id: userId,
        name: newProd.name,
        category: newProd.category,
        sku: newProd.sku,
        price: newProd.price,
        cost: newProd.cost,
        margin: newProd.margin,
        status: newProd.status,
        description: newProd.description,
        image_url: newProd.imageUrl,
        website_url: newProd.websiteUrl,
        created_at: newProd.createdAt
      })
    ).catch(() => {});
  } catch {
    // Fallback
  }

  return newProd;
}

export async function getBusinessProducts(businessId: string): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        businessId: d.business_id,
        userId: d.user_id,
        name: d.name,
        category: d.category,
        sku: d.sku,
        price: Number(d.price),
        cost: Number(d.cost),
        margin: Number(d.margin),
        status: d.status,
        description: d.description,
        imageUrl: d.image_url,
        websiteUrl: d.website_url,
        createdAt: d.created_at
      }));
    }
  } catch {
    // Fallback
  }

  const list: Product[] = [];
  memProducts.forEach(p => {
    if (p.businessId === businessId) list.push(p);
  });
  return list;
}

export async function createCampaign(
  userId: string,
  camp: {
    businessId: string;
    name: string;
    objective?: 'PRODUCT_LAUNCH' | 'SALES' | 'AWARENESS' | 'GROWTH' | 'RETARGETING';
    audience?: string;
    offer?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    channels?: string[];
    goalId?: string;
    projectId?: string;
  }
): Promise<Campaign> {
  const id = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newCamp: Campaign = {
    id,
    businessId: camp.businessId,
    userId,
    name: camp.name,
    objective: camp.objective || 'PRODUCT_LAUNCH',
    audience: camp.audience || 'Tier 1/2 Urban Youth',
    offer: camp.offer || 'Launch Price + Free Express Delivery',
    startDate: camp.startDate || new Date().toISOString().split('T')[0],
    endDate: camp.endDate,
    budget: camp.budget || 5000,
    spent: 0,
    channels: camp.channels || ['INSTAGRAM', 'FACEBOOK_ADS', 'WHATSAPP'],
    status: 'READY',
    goalId: camp.goalId,
    projectId: camp.projectId,
    createdAt: new Date().toISOString()
  };

  memCampaigns.set(id, newCamp);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('campaigns').insert({
        id,
        business_id: newCamp.businessId,
        user_id: userId,
        name: newCamp.name,
        objective: newCamp.objective,
        audience: newCamp.audience,
        offer: newCamp.offer,
        start_date: newCamp.startDate,
        end_date: newCamp.endDate,
        budget: newCamp.budget,
        spent: newCamp.spent,
        channels: newCamp.channels,
        status: newCamp.status,
        goal_id: newCamp.goalId,
        project_id: newCamp.projectId,
        created_at: newCamp.createdAt
      })
    ).catch(() => {});
  } catch {
    // Fallback
  }

  return newCamp;
}

export async function getBusinessCampaigns(businessId: string): Promise<Campaign[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        businessId: d.business_id,
        userId: d.user_id,
        name: d.name,
        objective: d.objective,
        audience: d.audience,
        offer: d.offer,
        startDate: d.start_date,
        endDate: d.end_date,
        budget: Number(d.budget),
        spent: Number(d.spent),
        channels: d.channels || [],
        status: d.status,
        goalId: d.goal_id,
        projectId: d.project_id,
        createdAt: d.created_at
      }));
    }
  } catch {
    // Fallback
  }

  const list: Campaign[] = [];
  memCampaigns.forEach(c => {
    if (c.businessId === businessId) list.push(c);
  });
  return list;
}

export async function createOpportunity(
  userId: string,
  opp: {
    businessId: string;
    title: string;
    category?: 'MARKET_TREND' | 'COMPETITOR_GAP' | 'PRODUCT_CONCEPT' | 'AUDIENCE_NEED';
    evidence: string;
    targetAudience?: string;
    suggestedExperiment?: string;
  }
): Promise<ResearchOpportunity> {
  const id = `opp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newOpp: ResearchOpportunity = {
    id,
    businessId: opp.businessId,
    userId,
    title: opp.title,
    category: opp.category || 'MARKET_TREND',
    evidence: opp.evidence,
    targetAudience: opp.targetAudience,
    suggestedExperiment: opp.suggestedExperiment,
    status: 'ACCEPTED',
    createdAt: new Date().toISOString()
  };

  memOpportunities.set(id, newOpp);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('research_opportunities').insert({
        id,
        business_id: newOpp.businessId,
        user_id: userId,
        title: newOpp.title,
        category: newOpp.category,
        evidence: newOpp.evidence,
        target_audience: newOpp.targetAudience,
        suggested_experiment: newOpp.suggestedExperiment,
        status: newOpp.status,
        created_at: newOpp.createdAt
      })
    ).catch(() => {});
  } catch {
    // Fallback
  }

  return newOpp;
}

export async function getBusinessOpportunities(businessId: string): Promise<ResearchOpportunity[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('research_opportunities')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        businessId: d.business_id,
        userId: d.user_id,
        title: d.title,
        category: d.category,
        evidence: d.evidence,
        targetAudience: d.target_audience,
        suggestedExperiment: d.suggested_experiment,
        status: d.status,
        createdAt: d.created_at
      }));
    }
  } catch {
    // Fallback
  }

  const list: ResearchOpportunity[] = [];
  memOpportunities.forEach(o => {
    if (o.businessId === businessId) list.push(o);
  });
  return list;
}
