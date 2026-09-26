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

function mapBusiness(d: any): Business {
  return {
    id: d.id,
    userId: d.user_id,
    name: d.name,
    description: d.description || '',
    industry: d.industry || '',
    businessType: d.business_type,
    website: d.website || '',
    primaryMarket: d.primary_market || '',
    targetAudience: d.target_audience || '',
    brandVoice: d.brand_voice || '',
    currency: d.currency || 'INR',
    timezone: d.timezone || 'Asia/Kolkata',
    primaryGoal: d.primary_goal || '',
    status: d.status,
    createdAt: d.created_at
  };
}

export async function createBusiness(
  userId: string,
  data: {
    name: string;
    description?: string;
    industry?: string;
    businessType?: Business['businessType'];
    website?: string;
    primaryMarket?: string;
    targetAudience?: string;
    brandVoice?: string;
    primaryGoal?: string;
  }
): Promise<Business> {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('businesses')
    .insert({
      user_id: userId,
      name: data.name,
      description: data.description || '',
      industry: data.industry || null,
      business_type: data.businessType || 'E_COMMERCE',
      website: data.website || null,
      primary_market: data.primaryMarket || 'India',
      target_audience: data.targetAudience || null,
      brand_voice: data.brandVoice || '',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      primary_goal: data.primaryGoal || null,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (error || !row) throw new Error(error?.message || 'Failed to create business.');
  return mapBusiness(row);
}

export async function getUserBusinesses(userId: string): Promise<Business[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapBusiness);
}

export async function getActiveBusiness(userId: string): Promise<Business | null> {
  const businesses = await getUserBusinesses(userId);
  return businesses[0] || null;
}

export async function updateBrandProfile(
  userId: string,
  businessId: string,
  profile: Partial<BrandProfile>
): Promise<BrandProfile> {
  const supabase = createClient();
  const { data: existing, error: lookupError } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  const payload = {
    business_id: businessId,
    user_id: userId,
    tagline: profile.tagline || null,
    positioning: profile.positioning || null,
    visual_direction: profile.visualDirection || null,
    content_style: profile.contentStyle || null,
    do_not_use: profile.doNotUse || [],
    preferred_channels: profile.preferredChannels || [],
    product_categories: profile.productCategories || [],
    price_positioning: profile.pricePositioning || 'MID_TIER',
    core_messages: profile.coreMessages || [],
    updated_at: new Date().toISOString()
  };

  const query = existing?.id
    ? supabase.from('brand_profiles').update(payload).eq('id', existing.id).eq('user_id', userId)
    : supabase.from('brand_profiles').insert(payload);

  const { data: row, error } = await query.select().single();
  if (error || !row) throw new Error(error?.message || 'Failed to save brand profile.');

  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    tagline: row.tagline || undefined,
    positioning: row.positioning || undefined,
    visualDirection: row.visual_direction || undefined,
    contentStyle: row.content_style || undefined,
    doNotUse: row.do_not_use || [],
    preferredChannels: row.preferred_channels || [],
    productCategories: row.product_categories || [],
    pricePositioning: row.price_positioning || 'MID_TIER',
    coreMessages: row.core_messages || [],
    createdAt: row.created_at
  };
}

export async function getBrandProfile(businessId: string): Promise<BrandProfile | null> {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    tagline: row.tagline || undefined,
    positioning: row.positioning || undefined,
    visualDirection: row.visual_direction || undefined,
    contentStyle: row.content_style || undefined,
    doNotUse: row.do_not_use || [],
    preferredChannels: row.preferred_channels || [],
    productCategories: row.product_categories || [],
    pricePositioning: row.price_positioning || 'MID_TIER',
    coreMessages: row.core_messages || [],
    createdAt: row.created_at
  };
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
    status?: Product['status'];
    description?: string;
    imageUrl?: string;
    websiteUrl?: string;
  }
): Promise<Product> {
  const supabase = createClient();
  const price = Number(product.price || 0);
  const cost = Number(product.cost || 0);
  const margin = price > 0 ? Number((((price - cost) / price) * 100).toFixed(2)) : 0;

  const { data: row, error } = await supabase
    .from('products')
    .insert({
      business_id: product.businessId,
      user_id: userId,
      name: product.name,
      category: product.category || null,
      sku: product.sku || null,
      price,
      cost,
      margin,
      status: product.status || 'ACTIVE',
      description: product.description || '',
      image_url: product.imageUrl || null,
      website_url: product.websiteUrl || null
    })
    .select()
    .single();

  if (error || !row) throw new Error(error?.message || 'Failed to create product.');
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    name: row.name,
    category: row.category || undefined,
    sku: row.sku || undefined,
    price: Number(row.price),
    cost: Number(row.cost),
    margin: Number(row.margin),
    status: row.status,
    description: row.description || '',
    imageUrl: row.image_url || undefined,
    websiteUrl: row.website_url || undefined,
    createdAt: row.created_at
  };
}

export async function getBusinessProducts(businessId: string): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((d: any) => ({
    id: d.id,
    businessId: d.business_id,
    userId: d.user_id,
    name: d.name,
    category: d.category || undefined,
    sku: d.sku || undefined,
    price: Number(d.price),
    cost: Number(d.cost),
    margin: Number(d.margin),
    status: d.status,
    description: d.description || '',
    imageUrl: d.image_url || undefined,
    websiteUrl: d.website_url || undefined,
    createdAt: d.created_at
  }));
}

export async function createCampaign(
  userId: string,
  camp: {
    businessId: string;
    name: string;
    objective?: Campaign['objective'];
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
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('campaigns')
    .insert({
      business_id: camp.businessId,
      user_id: userId,
      name: camp.name,
      objective: camp.objective || 'AWARENESS',
      audience: camp.audience || null,
      offer: camp.offer || null,
      start_date: camp.startDate || null,
      end_date: camp.endDate || null,
      budget: Number(camp.budget || 0),
      spent: 0,
      channels: camp.channels || [],
      status: 'DRAFT',
      goal_id: camp.goalId || null,
      project_id: camp.projectId || null
    })
    .select()
    .single();

  if (error || !row) throw new Error(error?.message || 'Failed to create campaign.');
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    name: row.name,
    objective: row.objective,
    audience: row.audience || undefined,
    offer: row.offer || undefined,
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    budget: Number(row.budget),
    spent: Number(row.spent),
    channels: row.channels || [],
    status: row.status,
    goalId: row.goal_id || undefined,
    projectId: row.project_id || undefined,
    createdAt: row.created_at
  };
}

export async function getBusinessCampaigns(businessId: string): Promise<Campaign[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((d: any) => ({
    id: d.id,
    businessId: d.business_id,
    userId: d.user_id,
    name: d.name,
    objective: d.objective,
    audience: d.audience || undefined,
    offer: d.offer || undefined,
    startDate: d.start_date || undefined,
    endDate: d.end_date || undefined,
    budget: Number(d.budget),
    spent: Number(d.spent),
    channels: d.channels || [],
    status: d.status,
    goalId: d.goal_id || undefined,
    projectId: d.project_id || undefined,
    createdAt: d.created_at
  }));
}

export async function createOpportunity(
  userId: string,
  opp: {
    businessId: string;
    title: string;
    category?: ResearchOpportunity['category'];
    evidence: string;
    targetAudience?: string;
    suggestedExperiment?: string;
  }
): Promise<ResearchOpportunity> {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('research_opportunities')
    .insert({
      business_id: opp.businessId,
      user_id: userId,
      title: opp.title,
      category: opp.category || 'MARKET_TREND',
      evidence: opp.evidence,
      target_audience: opp.targetAudience || null,
      suggested_experiment: opp.suggestedExperiment || null,
      status: 'NEW'
    })
    .select()
    .single();

  if (error || !row) throw new Error(error?.message || 'Failed to create opportunity.');
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    evidence: row.evidence,
    targetAudience: row.target_audience || undefined,
    suggestedExperiment: row.suggested_experiment || undefined,
    status: row.status,
    createdAt: row.created_at
  };
}

export async function getBusinessOpportunities(businessId: string): Promise<ResearchOpportunity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('research_opportunities')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((d: any) => ({
    id: d.id,
    businessId: d.business_id,
    userId: d.user_id,
    title: d.title,
    category: d.category,
    evidence: d.evidence,
    targetAudience: d.target_audience || undefined,
    suggestedExperiment: d.suggested_experiment || undefined,
    status: d.status,
    createdAt: d.created_at
  }));
}
