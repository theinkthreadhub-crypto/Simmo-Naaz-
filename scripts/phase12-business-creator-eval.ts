/**
 * MENTRA PHASE 12: CREATOR + BUSINESS WORKSPACE EVALUATION SUITE
 */

import {
  createBusiness,
  updateBrandProfile,
  getBrandProfile,
  createProduct,
  getBusinessProducts,
  createCampaign,
  getBusinessCampaigns,
  createOpportunity,
  getBusinessOpportunities
} from '../src/lib/db/business';
import {
  createContentItem,
  getBusinessContent,
  updateContentStatus,
  createCreativeAsset,
  getBusinessAssets
} from '../src/lib/db/creator';
import { generateCampaignContentPack } from '../src/lib/ai/agents/creativeAgent';

async function runPhase12Evaluation() {
  console.log('====================================================');
  console.log(' MENTRA PHASE 12 EVALUATION: CREATOR & BUSINESS HUB ');
  console.log('====================================================\n');

  let passed = 0;
  const total = 7;

  const testUser = `usr_biz_${Date.now()}`;
  let businessId = '';

  // TEST 1: Business & Brand Profile Initialization
  try {
    console.log('[TEST 1/7] Business Entity & Brand Profile Setup...');
    const biz = await createBusiness(testUser, {
      name: 'InkThread Hub',
      description: 'D2C Streetwear & Heavyweight Apparel Brand',
      industry: 'Fashion & Apparel',
      primaryGoal: '₹1L Monthly Direct Sales'
    });

    businessId = biz.id;

    const brand = await updateBrandProfile(testUser, businessId, {
      tagline: 'Wear Your Vibe — Heavyweight 280 GSM Streetwear',
      positioning: 'Accessible luxury streetwear for Indian youth',
      visualDirection: 'Dark aesthetic, gritty urban typography'
    });

    const retrievedBrand = await getBrandProfile(businessId);
    if (!retrievedBrand || retrievedBrand.tagline !== 'Wear Your Vibe — Heavyweight 280 GSM Streetwear') {
      throw new Error('Brand profile retrieval failed');
    }

    console.log(`  -> PASS: Business '${biz.name}' and Brand Profile initialized.`);
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 1): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 2: Product Catalog & Margin Calculation
  try {
    console.log('\n[TEST 2/7] Product Catalog & Deterministic Margins...');
    const prod = await createProduct(testUser, {
      businessId,
      name: 'Onyx Black Heavyweight Tee',
      category: 'Oversized Tees',
      price: 599,
      cost: 220
    });

    if (prod.margin !== 63) {
      throw new Error(`Expected margin 63%, got ${prod.margin}%`);
    }

    const products = await getBusinessProducts(businessId);
    if (products.length === 0 || products[0].name !== 'Onyx Black Heavyweight Tee') {
      throw new Error('Product catalog retrieval failed');
    }

    console.log(`  -> PASS: Product '${prod.name}' registered at ₹${prod.price} with ${prod.margin}% margin.`);
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 2): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 3: Campaign Management & Strategic Objectives
  try {
    console.log('\n[TEST 3/7] Campaign Management & Strategic Objectives...');
    const camp = await createCampaign(testUser, {
      businessId,
      name: 'Oversized Summer Drop 2026',
      objective: 'PRODUCT_LAUNCH',
      offer: 'Launch Price ₹599 + Free Delivery',
      budget: 5000,
      channels: ['INSTAGRAM', 'FACEBOOK_ADS', 'WHATSAPP']
    });

    const campaigns = await getBusinessCampaigns(businessId);
    if (campaigns.length === 0 || campaigns[0].name !== 'Oversized Summer Drop 2026') {
      throw new Error('Campaign retrieval failed');
    }

    console.log(`  -> PASS: Campaign '${camp.name}' created with ₹${camp.budget} budget.`);
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 3): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 4: Creator Content Pipeline Lifecycle
  try {
    console.log('\n[TEST 4/7] Creator Content Pipeline Lifecycle...');
    const item = await createContentItem(testUser, {
      businessId,
      platform: 'INSTAGRAM',
      contentType: 'REEL',
      title: 'Stop buying flimsy oversized tees',
      hook: 'Tired of collars that stretch out in 2 washes?',
      status: 'DRAFT'
    });

    await updateContentStatus(item.id, 'APPROVED');

    const contentList = await getBusinessContent(businessId);
    const updated = contentList.find(c => c.id === item.id);
    if (!updated || updated.status !== 'APPROVED') {
      throw new Error('Content status update failed');
    }

    console.log(`  -> PASS: Content item transitioned DRAFT -> APPROVED in pipeline.`);
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 4): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 5: Creative Agent Multi-Platform Content Pack Generation
  try {
    console.log('\n[TEST 5/7] Creative Agent Content Pack Generation...');
    const brand = (await getBrandProfile(businessId))!;
    const campaigns = await getBusinessCampaigns(businessId);
    const products = await getBusinessProducts(businessId);

    const pack = generateCampaignContentPack(brand, campaigns[0], products[0]);

    if (!pack.reel.script.includes('280 GSM') || pack.carousel.slides.length !== 4 || !pack.adCreative.headline) {
      throw new Error('Content pack generation missing structured components');
    }

    console.log('  -> PASS: Generated cohesive Reel script, 4-slide Carousel, Ad copy, and Brief.');
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 5): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 6: Research to Opportunity Engine
  try {
    console.log('\n[TEST 6/7] Research to Opportunity Engine...');
    const opp = await createOpportunity(testUser, {
      businessId,
      title: 'Hindi Micro-Text Streetwear Trend',
      category: 'MARKET_TREND',
      evidence: 'High social engagement on tier-2 urban fashion reels',
      suggestedExperiment: 'Test 3 minimal Hindi typography graphic tees'
    });

    const opps = await getBusinessOpportunities(businessId);
    if (opps.length === 0 || opps[0].title !== 'Hindi Micro-Text Streetwear Trend') {
      throw new Error('Opportunity retrieval failed');
    }

    console.log(`  -> PASS: Research opportunity '${opp.title}' validated.`);
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 6): ${err instanceof Error ? err.message : String(err)}`);
  }

  // TEST 7: Creative Asset Lifecycle
  try {
    console.log('\n[TEST 7/7] Creative Asset Registry & Lifecycle...');
    const asset = await createCreativeAsset(testUser, {
      businessId,
      assetType: 'DESIGN_ARTWORK',
      title: 'Heavyweight Ribbed Collar Macro',
      status: 'APPROVED',
      dimensions: '1080x1350'
    });

    const assets = await getBusinessAssets(businessId);
    if (assets.length === 0 || assets[0].title !== 'Heavyweight Ribbed Collar Macro') {
      throw new Error('Creative asset retrieval failed');
    }

    console.log(`  -> PASS: Creative asset '${asset.title}' registered and approved.`);
    passed++;
  } catch (err: unknown) {
    console.error(`  -> FAIL (Test 7): ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log('\n====================================================');
  console.log(`EVALUATION RESULT: ${passed}/${total} PASSED`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase12Evaluation().catch(err => {
  console.error('Unhandled failure in Phase 12 evaluation:', err);
  process.exit(1);
});
