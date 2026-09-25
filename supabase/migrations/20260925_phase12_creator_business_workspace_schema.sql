-- ==============================================================================
-- MENTRA PHASE 12: CREATOR + BUSINESS WORKSPACE SCHEMA
-- ==============================================================================

-- 1. Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    business_type TEXT DEFAULT 'E_COMMERCE', -- 'E_COMMERCE', 'CREATOR', 'AGENCY', 'SAAS', 'SERVICE'
    website TEXT,
    primary_market TEXT DEFAULT 'India',
    target_audience TEXT,
    brand_voice TEXT DEFAULT 'Direct, Modern, Relatable',
    currency TEXT DEFAULT 'INR',
    timezone TEXT DEFAULT 'Asia/Kolkata',
    primary_goal TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'ARCHIVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own businesses"
    ON public.businesses FOR ALL
    USING (auth.uid() = user_id);

-- 2. Brand Profiles Table
CREATE TABLE IF NOT EXISTS public.brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tagline TEXT,
    positioning TEXT,
    visual_direction TEXT,
    content_style TEXT,
    do_not_use TEXT[],
    preferred_channels TEXT[],
    product_categories TEXT[],
    price_positioning TEXT, -- 'BUDGET', 'MID_TIER', 'PREMIUM', 'LUXURY'
    core_messages TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own brand profiles"
    ON public.brand_profiles FOR ALL
    USING (auth.uid() = user_id);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    sku TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost NUMERIC(12, 2) DEFAULT 0,
    margin NUMERIC(5, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'IDEA', 'DEVELOPMENT', 'READY', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'
    description TEXT,
    image_url TEXT,
    website_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own products"
    ON public.products FOR ALL
    USING (auth.uid() = user_id);

-- 4. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objective TEXT NOT NULL, -- 'PRODUCT_LAUNCH', 'SALES', 'AWARENESS', 'GROWTH', 'RETARGETING'
    audience TEXT,
    offer TEXT,
    start_date DATE,
    end_date DATE,
    budget NUMERIC(12, 2) DEFAULT 0,
    spent NUMERIC(12, 2) DEFAULT 0,
    channels TEXT[], -- 'INSTAGRAM', 'FACEBOOK_ADS', 'WHATSAPP', 'EMAIL', 'WEBSITE'
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PLANNED', 'READY', 'ACTIVE', 'PAUSED', 'COMPLETE', 'CANCELLED'
    goal_id TEXT,
    project_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own campaigns"
    ON public.campaigns FOR ALL
    USING (auth.uid() = user_id);

-- 5. Content Items Table (Creator Pipeline)
CREATE TABLE IF NOT EXISTS public.content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'EMAIL', 'WEBSITE', 'YOUTUBE'
    content_type TEXT NOT NULL, -- 'REEL', 'CAROUSEL', 'POST', 'STORY', 'AD_CREATIVE', 'EMAIL', 'WHATSAPP_DRAFT'
    title TEXT NOT NULL,
    hook TEXT,
    caption TEXT,
    script TEXT,
    cta TEXT,
    hashtags TEXT[],
    creative_brief JSONB,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'IDEA', 'RESEARCHED', 'PLANNED', 'DRAFT', 'CREATIVE_READY', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    external_post_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own content items"
    ON public.content_items FOR ALL
    USING (auth.uid() = user_id);

-- 6. Creative Assets Table
CREATE TABLE IF NOT EXISTS public.creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL, -- 'IMAGE', 'VIDEO', 'LOGO_REFERENCE', 'PRODUCT_IMAGE', 'DESIGN_ARTWORK', 'THUMBNAIL', 'DOCUMENT', 'COPY'
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'READY', -- 'REQUESTED', 'GENERATING', 'READY', 'REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'
    storage_url TEXT,
    external_url TEXT,
    dimensions TEXT,
    duration_seconds INTEGER,
    prompt_used TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own creative assets"
    ON public.creative_assets FOR ALL
    USING (auth.uid() = user_id);

-- 7. Research Opportunities Table
CREATE TABLE IF NOT EXISTS public.research_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'MARKET_TREND', 'COMPETITOR_GAP', 'PRODUCT_CONCEPT', 'AUDIENCE_NEED'
    evidence TEXT NOT NULL,
    target_audience TEXT,
    suggested_experiment TEXT,
    status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'VALIDATING', 'ACCEPTED', 'REJECTED', 'TESTING', 'PROVEN'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.research_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own research opportunities"
    ON public.research_opportunities FOR ALL
    USING (auth.uid() = user_id);

-- 8. Business Experiments Table
CREATE TABLE IF NOT EXISTS public.business_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    hypothesis TEXT NOT NULL,
    variant_a TEXT NOT NULL,
    variant_b TEXT NOT NULL,
    metric TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'RUNNING', 'CONCLUDED'
    result_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own business experiments"
    ON public.business_experiments FOR ALL
    USING (auth.uid() = user_id);

-- Indexes for performance and scoping
CREATE INDEX IF NOT EXISTS idx_businesses_user ON public.businesses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_business ON public.campaigns(business_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_content_items_business_status ON public.content_items(business_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_creative_assets_campaign ON public.creative_assets(campaign_id, user_id);
CREATE INDEX IF NOT EXISTS idx_research_opportunities_business ON public.research_opportunities(business_id, status);
