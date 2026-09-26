import { createClient } from '@/lib/supabase/server';

export interface ContentItem {
  id: string;
  businessId: string;
  campaignId?: string;
  userId: string;
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'EMAIL' | 'WEBSITE' | 'YOUTUBE';
  contentType: 'REEL' | 'CAROUSEL' | 'POST' | 'STORY' | 'AD_CREATIVE' | 'EMAIL' | 'WHATSAPP_DRAFT';
  title: string;
  hook?: string;
  caption?: string;
  script?: string;
  cta?: string;
  hashtags: string[];
  creativeBrief?: {
    objective: string;
    hookDescription: string;
    sceneDirection: string;
    visualTone: string;
    assetsRequired: string[];
  };
  status: 'IDEA' | 'RESEARCHED' | 'PLANNED' | 'DRAFT' | 'CREATIVE_READY' | 'REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  scheduledAt?: string;
  publishedAt?: string;
  externalPostId?: string;
  createdAt: string;
}

export interface CreativeAsset {
  id: string;
  businessId: string;
  campaignId?: string;
  userId: string;
  assetType: 'IMAGE' | 'VIDEO' | 'LOGO_REFERENCE' | 'PRODUCT_IMAGE' | 'DESIGN_ARTWORK' | 'THUMBNAIL' | 'DOCUMENT' | 'COPY';
  title: string;
  status: 'REQUESTED' | 'GENERATING' | 'READY' | 'REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'ARCHIVED';
  storageUrl?: string;
  externalUrl?: string;
  dimensions?: string;
  durationSeconds?: number;
  promptUsed?: string;
  createdAt: string;
}

function mapContent(d: any): ContentItem {
  return {
    id: d.id,
    businessId: d.business_id,
    campaignId: d.campaign_id || undefined,
    userId: d.user_id,
    platform: d.platform,
    contentType: d.content_type,
    title: d.title,
    hook: d.hook || undefined,
    caption: d.caption || undefined,
    script: d.script || undefined,
    cta: d.cta || undefined,
    hashtags: d.hashtags || [],
    creativeBrief: d.creative_brief || undefined,
    status: d.status,
    scheduledAt: d.scheduled_at || undefined,
    publishedAt: d.published_at || undefined,
    externalPostId: d.external_post_id || undefined,
    createdAt: d.created_at
  };
}

function mapAsset(d: any): CreativeAsset {
  return {
    id: d.id,
    businessId: d.business_id,
    campaignId: d.campaign_id || undefined,
    userId: d.user_id,
    assetType: d.asset_type,
    title: d.title,
    status: d.status,
    storageUrl: d.storage_url || undefined,
    externalUrl: d.external_url || undefined,
    dimensions: d.dimensions || undefined,
    durationSeconds: d.duration_seconds || undefined,
    promptUsed: d.prompt_used || undefined,
    createdAt: d.created_at
  };
}

export async function createContentItem(
  userId: string,
  data: {
    businessId: string;
    campaignId?: string;
    platform?: ContentItem['platform'];
    contentType?: ContentItem['contentType'];
    title: string;
    hook?: string;
    caption?: string;
    script?: string;
    cta?: string;
    hashtags?: string[];
    creativeBrief?: ContentItem['creativeBrief'];
    status?: ContentItem['status'];
    scheduledAt?: string;
  }
): Promise<ContentItem> {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('content_items')
    .insert({
      business_id: data.businessId,
      campaign_id: data.campaignId || null,
      user_id: userId,
      platform: data.platform || 'INSTAGRAM',
      content_type: data.contentType || 'POST',
      title: data.title,
      hook: data.hook || null,
      caption: data.caption || null,
      script: data.script || null,
      cta: data.cta || null,
      hashtags: data.hashtags || [],
      creative_brief: data.creativeBrief || null,
      status: data.status || 'DRAFT',
      scheduled_at: data.scheduledAt || null
    })
    .select()
    .single();

  if (error || !row) throw new Error(error?.message || 'Failed to create content item.');
  return mapContent(row);
}

export async function updateContentStatus(
  userId: string,
  contentId: string,
  status: ContentItem['status']
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('content_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', contentId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return true;
}

export async function getBusinessContent(
  businessId: string,
  campaignId?: string
): Promise<ContentItem[]> {
  const supabase = createClient();
  let query = supabase
    .from('content_items')
    .select('*')
    .eq('business_id', businessId);

  if (campaignId) query = query.eq('campaign_id', campaignId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapContent);
}

export async function createCreativeAsset(
  userId: string,
  asset: {
    businessId: string;
    campaignId?: string;
    assetType: CreativeAsset['assetType'];
    title: string;
    status?: CreativeAsset['status'];
    storageUrl?: string;
    externalUrl?: string;
    dimensions?: string;
    durationSeconds?: number;
    promptUsed?: string;
  }
): Promise<CreativeAsset> {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('creative_assets')
    .insert({
      business_id: asset.businessId,
      campaign_id: asset.campaignId || null,
      user_id: userId,
      asset_type: asset.assetType,
      title: asset.title,
      status: asset.status || 'READY',
      storage_url: asset.storageUrl || null,
      external_url: asset.externalUrl || null,
      dimensions: asset.dimensions || null,
      duration_seconds: asset.durationSeconds || null,
      prompt_used: asset.promptUsed || null
    })
    .select()
    .single();

  if (error || !row) throw new Error(error?.message || 'Failed to create creative asset.');
  return mapAsset(row);
}

export async function getBusinessAssets(
  businessId: string,
  campaignId?: string
): Promise<CreativeAsset[]> {
  const supabase = createClient();
  let query = supabase
    .from('creative_assets')
    .select('*')
    .eq('business_id', businessId);

  if (campaignId) query = query.eq('campaign_id', campaignId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapAsset);
}
