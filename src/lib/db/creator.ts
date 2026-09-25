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

const memContentItems = new Map<string, ContentItem>();
const memCreativeAssets = new Map<string, CreativeAsset>();

export async function createContentItem(
  userId: string,
  data: {
    businessId: string;
    campaignId?: string;
    platform?: 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'EMAIL' | 'WEBSITE' | 'YOUTUBE';
    contentType?: 'REEL' | 'CAROUSEL' | 'POST' | 'STORY' | 'AD_CREATIVE' | 'EMAIL' | 'WHATSAPP_DRAFT';
    title: string;
    hook?: string;
    caption?: string;
    script?: string;
    cta?: string;
    hashtags?: string[];
    creativeBrief?: any;
    status?: ContentItem['status'];
    scheduledAt?: string;
  }
): Promise<ContentItem> {
  const id = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const item: ContentItem = {
    id,
    businessId: data.businessId,
    campaignId: data.campaignId,
    userId,
    platform: data.platform || 'INSTAGRAM',
    contentType: data.contentType || 'REEL',
    title: data.title,
    hook: data.hook || '',
    caption: data.caption || '',
    script: data.script || '',
    cta: data.cta || 'Shop the Drop on inkthreadhub.com',
    hashtags: data.hashtags || ['#streetwearindia', '#oversizedtee', '#inkthreadhub'],
    creativeBrief: data.creativeBrief,
    status: data.status || 'DRAFT',
    scheduledAt: data.scheduledAt,
    createdAt: new Date().toISOString()
  };

  memContentItems.set(id, item);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('content_items').insert({
        id,
        business_id: item.businessId,
        campaign_id: item.campaignId || null,
        user_id: userId,
        platform: item.platform,
        content_type: item.contentType,
        title: item.title,
        hook: item.hook,
        caption: item.caption,
        script: item.script,
        cta: item.cta,
        hashtags: item.hashtags,
        creative_brief: item.creativeBrief || null,
        status: item.status,
        scheduled_at: item.scheduledAt || null,
        created_at: item.createdAt
      })
    ).catch(() => {});
  } catch {
    // Fallback
  }

  return item;
}

export async function updateContentStatus(
  contentId: string,
  status: ContentItem['status']
): Promise<boolean> {
  const item = memContentItems.get(contentId);
  if (item) {
    item.status = status;
  }

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('content_items').update({ status, updated_at: new Date().toISOString() }).eq('id', contentId)
    ).catch(() => {});
  } catch {
    // Fallback
  }

  return true;
}

export async function getBusinessContent(businessId: string, campaignId?: string): Promise<ContentItem[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from('content_items')
      .select('*')
      .eq('business_id', businessId);

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data } = await query.order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        businessId: d.business_id,
        campaignId: d.campaign_id,
        userId: d.user_id,
        platform: d.platform,
        contentType: d.content_type,
        title: d.title,
        hook: d.hook,
        caption: d.caption,
        script: d.script,
        cta: d.cta,
        hashtags: d.hashtags || [],
        creativeBrief: d.creative_brief,
        status: d.status,
        scheduledAt: d.scheduled_at,
        publishedAt: d.published_at,
        externalPostId: d.external_post_id,
        createdAt: d.created_at
      }));
    }
  } catch {
    // Fallback
  }

  const list: ContentItem[] = [];
  memContentItems.forEach(c => {
    if (c.businessId === businessId && (!campaignId || c.campaignId === campaignId)) {
      list.push(c);
    }
  });
  return list;
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
  const id = `ast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newAsset: CreativeAsset = {
    id,
    businessId: asset.businessId,
    campaignId: asset.campaignId,
    userId,
    assetType: asset.assetType,
    title: asset.title,
    status: asset.status || 'READY',
    storageUrl: asset.storageUrl,
    externalUrl: asset.externalUrl,
    dimensions: asset.dimensions,
    durationSeconds: asset.durationSeconds,
    promptUsed: asset.promptUsed,
    createdAt: new Date().toISOString()
  };

  memCreativeAssets.set(id, newAsset);

  try {
    const supabase = createClient();
    Promise.resolve(
      supabase.from('creative_assets').insert({
        id,
        business_id: newAsset.businessId,
        campaign_id: newAsset.campaignId || null,
        user_id: userId,
        asset_type: newAsset.assetType,
        title: newAsset.title,
        status: newAsset.status,
        storage_url: newAsset.storageUrl || null,
        external_url: newAsset.externalUrl || null,
        dimensions: newAsset.dimensions || null,
        duration_seconds: newAsset.durationSeconds || null,
        prompt_used: newAsset.promptUsed || null,
        created_at: newAsset.createdAt
      })
    ).catch(() => {});
  } catch {
    // Fallback
  }

  return newAsset;
}

export async function getBusinessAssets(businessId: string, campaignId?: string): Promise<CreativeAsset[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from('creative_assets')
      .select('*')
      .eq('business_id', businessId);

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data } = await query.order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        businessId: d.business_id,
        campaignId: d.campaign_id,
        userId: d.user_id,
        assetType: d.asset_type,
        title: d.title,
        status: d.status,
        storageUrl: d.storage_url,
        externalUrl: d.external_url,
        dimensions: d.dimensions,
        durationSeconds: d.duration_seconds,
        promptUsed: d.prompt_used,
        createdAt: d.created_at
      }));
    }
  } catch {
    // Fallback
  }

  const list: CreativeAsset[] = [];
  memCreativeAssets.forEach(a => {
    if (a.businessId === businessId && (!campaignId || a.campaignId === campaignId)) {
      list.push(a);
    }
  });
  return list;
}
