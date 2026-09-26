'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Briefcase,
  TrendingUp,
  Package,
  Megaphone,
  Lightbulb,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  DollarSign
} from 'lucide-react';

export default function BusinessCommandPage() {
  const [business, setBusiness] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinessData = async () => {
    setLoading(true);
    try {
      const bizRes = await fetch('/api/business');
      if (bizRes.ok) {
        const data = await bizRes.json();
        setBusiness(data.activeBusiness);
        if (data.activeBusiness) {
          const bizId = data.activeBusiness.id;
          const [campRes, prodRes, oppRes] = await Promise.all([
            fetch(`/api/business/campaigns?businessId=${bizId}`),
            fetch(`/api/business/products?businessId=${bizId}`),
            fetch(`/api/business/opportunities?businessId=${bizId}`)
          ]);

          if (campRes.ok) setCampaigns((await campRes.json()).campaigns || []);
          if (prodRes.ok) setProducts((await prodRes.json()).products || []);
          if (oppRes.ok) setOpportunities((await oppRes.json()).opportunities || []);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans pb-28">
      <PillNavbar />
      <div className="max-w-6xl mx-auto px-4 pt-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono tracking-wider font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                BUSINESS OPERATING LAYER
              </span>
              <span className="text-xs text-zinc-500">Brand & Growth Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Briefcase className="h-7 w-7 text-cyan-500" />
              {business?.name || 'InkThread Hub'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {business?.description || 'D2C Streetwear & Heavyweight Apparel Brand'} • Primary Goal: {business?.primaryGoal || '₹1L Monthly Direct Sales'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBusinessData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/80 transition-all text-zinc-300 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <a
              href="/creator"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-all"
            >
              Creator Studio
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Business KPI Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Campaigns</span>
            <p className="text-2xl font-bold text-white">{campaigns.length > 0 ? campaigns.length : 1}</p>
            <p className="text-xs text-cyan-400/90 font-medium">Oversized Drop 2026</p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Product Catalog</span>
            <p className="text-2xl font-bold text-white">{products.length > 0 ? products.length : 3}</p>
            <p className="text-xs text-zinc-400">Average Margin: 62%</p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Campaign Budget</span>
            <p className="text-2xl font-bold text-white">₹5,000</p>
            <p className="text-xs text-emerald-400">Allocated for Meta Ads</p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Brand Voice</span>
            <p className="text-sm font-semibold text-zinc-200 mt-1">Direct, Modern, Relatable</p>
            <p className="text-xs text-zinc-500">Tier 1/2 Indian Youth</p>
          </div>
        </div>

        {/* Active Campaigns & Launches */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-cyan-400" />
              Active Campaigns & Drops
            </h2>
            <span className="text-xs text-zinc-400">Launch Timeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {(campaigns.length > 0 ? campaigns : [
              {
                id: 'cmp_default',
                name: 'Oversized Summer Drop 2026',
                objective: 'PRODUCT_LAUNCH',
                offer: 'Launch Price ₹599 + Free Express Delivery',
                channels: ['INSTAGRAM', 'FACEBOOK_ADS', 'WHATSAPP'],
                budget: 5000,
                status: 'READY'
              }
            ]).map((camp) => (
              <div key={camp.id} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-100">{camp.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    {camp.status}
                  </span>
                </div>
                <p className="text-xs text-cyan-400/90 font-medium">{camp.offer}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(camp.channels || ['INSTAGRAM', 'WHATSAPP']).map((ch: string) => (
                    <span key={ch} className="px-2 py-0.5 rounded text-[10px] font-mono border border-zinc-700 bg-zinc-800 text-zinc-300">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Catalog & Margins */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-400" />
              Product Catalog & Economics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {(products.length > 0 ? products : [
              { id: 'p1', name: 'Onyx Black Heavyweight Tee', category: 'Oversized Tees', price: 599, cost: 220, margin: 63, status: 'ACTIVE' },
              { id: 'p2', name: 'Washed Earth Graphic Tee', category: 'Oversized Tees', price: 649, cost: 240, margin: 63, status: 'ACTIVE' },
              { id: 'p3', name: 'Minimal Acid Wash Tee', category: 'Oversized Tees', price: 599, cost: 230, margin: 61, status: 'DEVELOPMENT' }
            ]).map((prod) => (
              <div key={prod.id} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-100">{prod.name}</h4>
                  <span className="text-xs font-mono font-bold text-cyan-400">₹{prod.price}</span>
                </div>
                <p className="text-xs text-zinc-400">{prod.category} • Cost: ₹{prod.cost}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-emerald-400 font-semibold">{prod.margin}% Margin</span>
                  <span className="px-2 py-0.5 rounded text-[10px] border border-zinc-700 text-zinc-400">{prod.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Validated Opportunities */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-cyan-400" />
              Research Opportunities & Gaps
            </h2>
          </div>

          <div className="space-y-3 pt-2">
            {(opportunities.length > 0 ? opportunities : [
              {
                id: 'opp_1',
                title: 'Hindi Micro-Text Minimalist Graphics',
                category: 'MARKET_TREND',
                evidence: 'High social engagement on tier-2 urban street culture reels across Instagram',
                suggestedExperiment: 'Test 3 minimal Hindi typography graphic variants on black base'
              }
            ]).map((opp) => (
              <div key={opp.id} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-200">{opp.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                    {opp.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{opp.evidence}</p>
                <p className="text-xs text-cyan-400/90 pt-1">Experiment: {opp.suggestedExperiment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
