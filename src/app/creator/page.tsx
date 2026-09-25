'use client';

import React, { useState, useEffect } from 'react';
import PillNavbar from '@/components/navigation/PillNavbar';
import {
  Sparkles,
  Video,
  Layers,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
  Copy,
  Eye
} from 'lucide-react';

export default function CreatorWorkspacePage() {
  const [content, setContent] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'assets' | 'scripts'>('pipeline');
  const [loading, setLoading] = useState(true);

  const fetchCreatorData = async () => {
    setLoading(true);
    try {
      const bizRes = await fetch('/api/business');
      if (bizRes.ok) {
        const data = await bizRes.json();
        const bizId = data.activeBusiness?.id || 'biz_default';
        const [cntRes, astRes] = await Promise.all([
          fetch(`/api/creator/content?businessId=${bizId}`),
          fetch(`/api/creator/assets?businessId=${bizId}`)
        ]);

        if (cntRes.ok) setContent((await cntRes.json()).content || []);
        if (astRes.ok) setAssets((await astRes.json()).assets || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans pb-28">
      <PillNavbar />
      <div className="max-w-6xl mx-auto px-4 pt-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono tracking-wider font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                CREATOR WORKSPACE
              </span>
              <span className="text-xs text-zinc-500">Content Pipeline & Creative Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-amber-500" />
              Creator Studio & Pipeline
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Transform ideas into multi-platform Reels, Carousels, Ad Copy, and approved campaign assets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCreatorData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/80 transition-all text-zinc-300 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <a
              href="/business"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 transition-all text-white"
            >
              Business Hub
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            Content Pipeline
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'scripts'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            Campaign Scripts & Briefs
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'assets'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            Creative Assets Grid
          </button>
        </div>

        {/* Tab 1: Content Pipeline */}
        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: IDEAS & DRAFTS */}
            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ideas & Drafts</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">1</span>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/60 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-500/30 text-amber-400 bg-amber-500/10">
                  REEL
                </span>
                <h4 className="text-sm font-semibold text-zinc-100">Stop buying flimsy oversized tees</h4>
                <p className="text-xs text-zinc-400 line-clamp-2">Visual comparison zooming into 280 GSM collar vs cheap tees</p>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-500">
                  <span>Instagram</span>
                  <span className="text-amber-400 font-medium">Ready for Review</span>
                </div>
              </div>
            </div>

            {/* Column 2: IN REVIEW & APPROVAL */}
            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">In Review</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">1</span>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/60 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-500/30 text-blue-400 bg-blue-500/10">
                  CAROUSEL
                </span>
                <h4 className="text-sm font-semibold text-zinc-100">How to style an oversized drop 🛹</h4>
                <p className="text-xs text-zinc-400">4-slide carousel detailing silhouette, collar structure, and palette</p>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-500">
                  <span>Instagram</span>
                  <span className="text-emerald-400 font-medium">Approved</span>
                </div>
              </div>
            </div>

            {/* Column 3: SCHEDULED & PUBLISHED */}
            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Scheduled</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-mono">1</span>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/60 space-y-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-purple-500/30 text-purple-400 bg-purple-500/10">
                  AD CREATIVE
                </span>
                <h4 className="text-sm font-semibold text-zinc-100">Tired of oversized tees that look like pyjamas?</h4>
                <p className="text-xs text-zinc-400">Meta Feed & Story ad variant targeting Tier 1/2 streetwear buyers</p>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-500">
                  <span>Meta Ads</span>
                  <span className="text-purple-400 font-medium">Scheduled Friday</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scripts & Creative Briefs */}
        {activeTab === 'scripts' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Video className="h-5 w-5 text-amber-400" />
                  Hero Reel Script — Oversized Drop 2026
                </h3>
                <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white">
                  <Copy className="h-3.5 w-3.5" />
                  Copy Script
                </button>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/60 font-mono text-xs text-zinc-300 space-y-2.5 leading-relaxed">
                <p><span className="text-amber-400 font-semibold">[0-3s Hook]:</span> Fast transition zooming into collar and thick fabric texture.</p>
                <p><span className="text-amber-400 font-semibold">[3-7s Scene]:</span> Model styling Onyx Black Heavyweight Tee with dark cargos.</p>
                <p><span className="text-amber-400 font-semibold">[7-12s Detail]:</span> Text overlay: &quot;280 GSM Pure Combed Cotton • Drop Shoulder Cut&quot;.</p>
                <p><span className="text-amber-400 font-semibold">[12-15s CTA]:</span> Fast walk towards camera. &quot;If you want structured streetwear drape, tap link in bio.&quot;</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-400" />
                  Structured Creative Brief
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60 space-y-1">
                  <span className="text-zinc-500 uppercase font-semibold">Visual Tone & Scene</span>
                  <p className="text-zinc-200 font-medium">Dark aesthetic, raw urban concrete sidewalk, high-contrast natural lighting.</p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60 space-y-1">
                  <span className="text-zinc-500 uppercase font-semibold">Assets Required</span>
                  <p className="text-zinc-200 font-medium">1 Reel Video (9:16), 4 Carousel Slides (4:5), 2 Ad Graphics (1:1).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Creative Assets Grid */}
        {activeTab === 'assets' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(assets.length > 0 ? assets : [
              { id: 'a1', title: 'Onyx Black Front Studio Shot', assetType: 'PRODUCT_IMAGE', dimensions: '2048x2048', status: 'READY' },
              { id: 'a2', title: 'Heavyweight Ribbed Collar Macro', assetType: 'DESIGN_ARTWORK', dimensions: '1080x1350', status: 'APPROVED' },
              { id: 'a3', title: 'Streetwear Transition Reel Video', assetType: 'VIDEO', dimensions: '1080x1920', status: 'REVIEW' }
            ]).map((ast) => (
              <div key={ast.id} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 space-y-3">
                <div className="h-32 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <ImageIcon className="h-8 w-8 opacity-40 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-200">{ast.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                      {ast.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{ast.assetType} • {ast.dimensions}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
