import { searchEcommerceProducts } from '../src/lib/fashion/productHunter';
import { generateUGCContent, publishToSocialMedia } from '../src/lib/fashion/ugcSocialPoster';

async function runEndToEndTest() {
  console.log('====================================================');
  console.log('🚀 STEP 1: HUNTING TRENDING PRODUCTS ACROSS PLATFORMS');
  console.log('====================================================\n');

  const searchQuery = 'Oversized Anime Graphic T-Shirt for Men';
  const huntResult = await searchEcommerceProducts(searchQuery, ['Amazon', 'Myntra', 'Meesho'], 1);

  console.log(huntResult.formattedWhatsAppText);
  console.log('\n----------------------------------------------------');

  if (huntResult.products.length === 0) {
    console.error('❌ No products found.');
    return;
  }

  const selectedProduct = huntResult.products[0];
  console.log(`🎯 User Selected Product: ${selectedProduct.title} (₹${selectedProduct.price}) from ${selectedProduct.platform}\n`);

  console.log('====================================================');
  console.log('🎨 STEP 2: GENERATING AI UGC MODEL & VIRAL SOCIAL COPY');
  console.log('====================================================\n');

  const ugcResult = await generateUGCContent({
    userId: 'test_user_operator',
    productTitle: selectedProduct.title,
    productPrice: selectedProduct.price,
    productUrl: selectedProduct.productUrl,
    platform: selectedProduct.platform,
    category: 'Oversized T-Shirts'
  });

  console.log(ugcResult.message);
  console.log('\n----------------------------------------------------');
  console.log('📸 Generated UGC Model Prompt:\n', ugcResult.ugcModelPrompt);
  console.log('\n🖼️ UGC Model Preview Image URL:\n', ugcResult.imageUrl);
  console.log('\n📱 Instagram Caption:\n', ugcResult.instagramCaption);

  console.log('\n====================================================');
  console.log('🌐 STEP 3: EXECUTING META SUITE UPLOAD (BROWSER AUTOMATION)');
  console.log('====================================================\n');

  const publishResult = await publishToSocialMedia({
    productTitle: selectedProduct.title,
    price: selectedProduct.price,
    imageUrl: ugcResult.imageUrl,
    instagramCaption: ugcResult.instagramCaption,
    facebookCaption: ugcResult.facebookCaption,
    productUrl: selectedProduct.productUrl
  });

  console.log(publishResult.message);
  console.log('\n🎉 ALL PIPELINE STEPS COMPLETED SUCCESSFULLY!');
}

runEndToEndTest().catch(console.error);
