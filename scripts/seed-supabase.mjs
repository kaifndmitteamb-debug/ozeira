import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rgqzcjrduahsdkmqfuvr.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJncXpjanJkdWFoc2RrbXFmdXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDYwOTMsImV4cCI6MjEwMzQyMjA5M30.-swVfxKVjCQs6CwR9evBPRMLX7qb7hIKLxlBUxhP_IM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initial Categories
const categories = [
  {
    id: 'cat-1',
    name: 'Apparel & Knitwear',
    slug: 'apparel',
    description: 'Bespoke tailoring, breathable natural textiles, and elevated everyday luxury.',
    image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=600&auto=format&fit=crop',
    sort_order: 1,
    is_active: true,
    item_count: 8,
  },
  {
    id: 'cat-2',
    name: 'Leather Goods & Bags',
    slug: 'leather-goods',
    description: 'Masterfully stitched full-grain hides aged naturally with rich patinas.',
    image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600&auto=format&fit=crop',
    sort_order: 2,
    is_active: true,
    item_count: 6,
  },
  {
    id: 'cat-3',
    name: 'Fine Heirloom Jewelry',
    slug: 'jewelry',
    description: '18K gold vermeil, conflict-free emeralds, and sculpted minimalist treasures.',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
    sort_order: 3,
    is_active: true,
    item_count: 5,
  },
  {
    id: 'cat-4',
    name: 'Footwear & Boots',
    slug: 'footwear',
    description: 'Goodyear welted durability with anatomical cork bed contours.',
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop',
    sort_order: 4,
    is_active: true,
    item_count: 4,
  },
  {
    id: 'cat-5',
    name: 'Accessories & Silk Scarves',
    slug: 'accessories',
    description: 'Hand-rolled mulberry silks, solid brass cufflinks, and bespoke cardholders.',
    image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=600&auto=format&fit=crop',
    sort_order: 5,
    is_active: true,
    item_count: 7,
  },
  {
    id: 'cat-6',
    name: 'Home Sanctuary & Scents',
    slug: 'home-fragrance',
    description: 'Cold-pressed botanicals, soy wax candles, and hand-chiseled marble jars.',
    image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=600&auto=format&fit=crop',
    sort_order: 6,
    is_active: true,
    item_count: 5,
  },
];

const subcategories = [
  { id: 'sub-101', category_id: 'cat-1', name: 'Coats & Outerwear', slug: 'outerwear', sort_order: 1, is_active: true },
  { id: 'sub-102', category_id: 'cat-1', name: 'Shirts & Blouses', slug: 'shirts', sort_order: 2, is_active: true },
  { id: 'sub-103', category_id: 'cat-1', name: 'Trousers & Chinos', slug: 'trousers', sort_order: 3, is_active: true },
  { id: 'sub-104', category_id: 'cat-1', name: 'Cashmere Sweaters', slug: 'cashmere', sort_order: 4, is_active: true },
  { id: 'sub-201', category_id: 'cat-2', name: 'Weekend Duffles', slug: 'duffles', sort_order: 1, is_active: true },
  { id: 'sub-202', category_id: 'cat-2', name: 'Structured Totes', slug: 'totes', sort_order: 2, is_active: true },
  { id: 'sub-203', category_id: 'cat-2', name: 'Wallets & Folios', slug: 'wallets', sort_order: 3, is_active: true },
  { id: 'sub-301', category_id: 'cat-3', name: 'Necklaces & Pendants', slug: 'necklaces', sort_order: 1, is_active: true },
  { id: 'sub-302', category_id: 'cat-3', name: 'Signet Rings', slug: 'rings', sort_order: 2, is_active: true },
  { id: 'sub-401', category_id: 'cat-4', name: 'Derby & Oxford Shoes', slug: 'oxfords', sort_order: 1, is_active: true },
  { id: 'sub-402', category_id: 'cat-4', name: 'Chelsea Boots', slug: 'chelsea-boots', sort_order: 2, is_active: true },
  { id: 'sub-501', category_id: 'cat-5', name: 'Silk Pocket Squares', slug: 'pocket-squares', sort_order: 1, is_active: true },
  { id: 'sub-601', category_id: 'cat-6', name: 'Aroma Diffusers', slug: 'diffusers', sort_order: 1, is_active: true },
];

const heroBanners = [
  {
    id: 'hero-1',
    title: 'The Artisanal Autumn Edition',
    subtitle: 'Meticulously tailored silhouettes in organic silk, Tuscan linen, and handwoven cashmere.',
    button_text: 'Explore Collection',
    button_url: '/shop?category=apparel',
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
    background_color: '#1e1c1a',
    badge_text: 'NEW ARRIVAL 2026',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'hero-2',
    title: 'Handcrafted Fine Accoutrements',
    subtitle: 'Sculpted brass, certified obsidian, and vegetable-tanned leather essentials.',
    button_text: 'Shop Accessories',
    button_url: '/shop?category=accessories',
    image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop',
    background_color: '#151c24',
    badge_text: 'LIMITED ATELIER PIECES',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'hero-3',
    title: 'Timeless Footwear & Heritage Boots',
    subtitle: 'Goodyear welted durability engineered for sublime all-day comfort and commanding presence.',
    button_text: 'Discover Footwear',
    button_url: '/shop?category=footwear',
    image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1600&auto=format&fit=crop',
    background_color: '#2b1e16',
    badge_text: 'CRAFT MASTERCLASS',
    sort_order: 3,
    is_active: true,
  },
];

const promoBanners = [
  {
    id: 'promo-1',
    title: 'The Obsidian Capsule',
    subtitle: 'Monochrome precision for modern living',
    badge_text: 'Spotlight',
    image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop',
    link_url: '/shop?category=apparel',
    grid_type: 'half',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'promo-2',
    title: 'Heirloom Fine Jewelry',
    subtitle: '18K Vermeil Gold & Lab-Grown Diamonds',
    badge_text: 'Exclusive',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop',
    link_url: '/shop?category=jewelry',
    grid_type: 'half',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'promo-3',
    title: 'Tote & Duffle Haven',
    subtitle: 'Full-grain Italian calfskin travel bags',
    badge_text: 'Bestseller',
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop',
    link_url: '/shop?category=leather-goods',
    grid_type: 'third',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'promo-4',
    title: 'Aroma & Home Sanctuary',
    subtitle: 'Hand-poured soy candles & botanicals',
    badge_text: 'New Fragrance',
    image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800&auto=format&fit=crop',
    link_url: '/shop?category=home-fragrance',
    grid_type: 'third',
    sort_order: 4,
    is_active: true,
  },
  {
    id: 'promo-5',
    title: 'The Minimalist Wardrobe',
    subtitle: '20 curated essentials for every occasion',
    badge_text: 'Curated',
    image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop',
    link_url: '/shop?category=apparel',
    grid_type: 'third',
    sort_order: 5,
    is_active: true,
  },
];

const announcements = [
  {
    id: 'ann-1',
    text: '✨ Compliment of Ozeira: Enjoy Complimentary Insured Express Shipping on Orders Above ₹1,999 with code LUXE10',
    link_url: '/shop',
    bg_color: '#1a1816',
    text_color: '#f5d480',
    is_active: true,
  },
];

const coupons = [
  {
    id: 'coup-1',
    code: 'LUXE10',
    description: '10% off on your entire luxury order above ₹1,999',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 1999,
    max_discount_amount: 5000,
    usage_limit: 1000,
    usage_count: 42,
    is_active: true,
  },
  {
    id: 'coup-2',
    code: 'FIRST500',
    description: 'Flat ₹500 discount for first-time atelier patrons',
    discount_type: 'flat',
    discount_value: 500,
    min_order_amount: 2999,
    usage_limit: 500,
    usage_count: 88,
    is_active: true,
  },
  {
    id: 'coup-3',
    code: 'ROYAL20',
    description: 'VIP 20% privilege concession on orders above ₹9,999',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_amount: 9999,
    max_discount_amount: 15000,
    usage_limit: 100,
    usage_count: 14,
    is_active: true,
  },
];

const offers = [
  {
    id: 'off-1',
    name: 'Monsoon Atelier Special',
    description: 'Complimentary ₹1,000 concession across entire Outerwear & Knitwear',
    discount_type: 'flat',
    discount_value: 1000,
    applies_to: 'category',
    target_ids: ['cat-1'],
    start_date: '2026-06-01T00:00:00Z',
    end_date: '2026-10-31T23:59:59Z',
    is_active: true,
  },
];

const users = [
  {
    id: 'user-admin-1',
    email: 'admin@ozeira.com',
    full_name: 'Alexander Vane',
    phone: '+91 98765 00001',
    role: 'admin',
    loyalty_points: 15000,
    referral_code: 'VANE-999',
    is_blocked: false,
  },
  {
    id: 'user-manager-1',
    email: 'orders@ozeira.com',
    full_name: 'Elena Rostova',
    phone: '+91 98765 00002',
    role: 'order_manager',
    loyalty_points: 3200,
    referral_code: 'ELENA-420',
    is_blocked: false,
  },
  {
    id: 'user-customer-1',
    email: 'patron@example.com',
    full_name: 'Aria Montgomery',
    phone: '+91 98765 43210',
    role: 'customer',
    loyalty_points: 1250,
    referral_code: 'ARIA-872',
    is_blocked: false,
  },
];

const products = [
  {
    id: 'prod-1',
    title: 'Celestial Silk Drape Blouse',
    slug: 'celestial-silk-drape-blouse',
    description: 'Woven from 22-momme pure mulberry silk, this drape blouse balances structure with fluid motion. Features mother-of-pearl buttons and tailored French seams for elevated occasion wear.',
    short_description: 'Pure 22-momme mulberry silk with French seams and bespoke mother-of-pearl hardware.',
    category_id: 'cat-1',
    subcategory_id: 'sub-102',
    category_name: 'Apparel & Knitwear',
    brand: 'Ozeira Atelier',
    base_price: 8999,
    sale_price: 7499,
    discount_percent: 17,
    sku: 'OZ-APP-001',
    total_stock: 24,
    is_featured: true,
    is_trending: true,
    is_new: true,
    rating_avg: 4.9,
    review_count: 34,
    tags: ['silk', 'mulberry', 'blouse', 'eveningwear', 'luxury-apparel'],
    specifications: { Material: '100% Grade 6A Mulberry Silk (22 Momme)', Fit: 'Relaxed Tailored', Origin: 'Handcrafted in Mumbai Atelier', Care: 'Dry Clean Only or Cold Hand Wash' },
    weight_grams: 320,
    is_active: true,
  },
  {
    id: 'prod-2',
    title: 'Grand Voyager Leather Duffle',
    slug: 'grand-voyager-leather-duffle',
    description: 'Sculpted from vegetable-tanned full-grain Tuscan cowhide that matures into a deep, personalized patina. Features solid brass YKK Excella zippers, reinforced rivets, and dedicated laptop and shoe compartments.',
    short_description: 'Full-grain Tuscan cowhide with solid brass hardware and separate ventilated shoe vault.',
    category_id: 'cat-2',
    subcategory_id: 'sub-201',
    category_name: 'Leather Goods & Bags',
    brand: 'Ozeira Pelle',
    base_price: 24999,
    sale_price: 21999,
    discount_percent: 12,
    sku: 'OZ-LEA-002',
    total_stock: 14,
    is_featured: true,
    is_trending: true,
    is_new: false,
    rating_avg: 5.0,
    review_count: 58,
    tags: ['leather', 'duffle', 'travel-bag', 'tuscan-leather', 'handcrafted'],
    specifications: { Material: 'Full-Grain Tuscan Vegetable-Tanned Leather', Lining: 'Heavyweight Water-Resistant Herringbone Canvas', Hardware: 'Hand-Antiqued Solid Brass', Capacity: '48 Litres' },
    weight_grams: 2100,
    is_active: true,
  },
  {
    id: 'prod-3',
    title: 'Obsidian & 18K Gold Signet Ring',
    slug: 'obsidian-18k-gold-signet-ring',
    description: 'Forged from recycled 925 sterling silver layered with 3.5-micron 18K yellow gold vermeil, crowned with a natural hand-chiseled midnight obsidian stone.',
    short_description: '18K gold vermeil signet ring crowned with natural midnight obsidian.',
    category_id: 'cat-3',
    subcategory_id: 'sub-302',
    category_name: 'Fine Heirloom Jewelry',
    brand: 'Ozeira Gioielli',
    base_price: 12499,
    sale_price: 10999,
    discount_percent: 12,
    sku: 'OZ-JEW-003',
    total_stock: 18,
    is_featured: true,
    is_trending: false,
    is_new: true,
    rating_avg: 4.8,
    review_count: 19,
    tags: ['ring', 'gold-vermeil', 'obsidian', '18k-gold', 'heirloom'],
    specifications: { Metal: '18K Yellow Gold Vermeil on Solid 925 Silver', Gemstone: 'Natural Midnight Obsidian', Finish: 'Hand-Polished High Mirror', Hallmarked: 'BIS & 925 Certified' },
    weight_grams: 18,
    is_active: true,
  },
  {
    id: 'prod-4',
    title: 'Heritage Goodyear Oxford Shoes',
    slug: 'heritage-goodyear-oxford-shoes',
    description: 'Crafted on our anatomical European last with 360-degree Goodyear welt construction. Full-grain French calfskin with hand-burnished espresso finish and vegetable-tanned leather sole.',
    short_description: 'French calfskin 360° Goodyear welted oxfords with hand-painted bevelled waist.',
    category_id: 'cat-4',
    subcategory_id: 'sub-401',
    category_name: 'Footwear & Boots',
    brand: 'Ozeira Calzature',
    base_price: 18999,
    sale_price: 16499,
    discount_percent: 13,
    sku: 'OZ-FTW-004',
    total_stock: 12,
    is_featured: true,
    is_trending: true,
    is_new: false,
    rating_avg: 4.9,
    review_count: 42,
    tags: ['oxfords', 'goodyear-welt', 'leather-shoes', 'formal-shoes'],
    specifications: { Leather: 'Grade-A French Box Calf', Construction: '360° Goodyear Storm Welted', Sole: 'Channelled Oak Bark Tanned Leather Sole', Last: 'Classic Almond Toe' },
    weight_grams: 1400,
    is_active: true,
  },
];

const productImages = [
  { id: 'img-1-1', product_id: 'prod-1', image_url: 'https://images.unsplash.com/photo-1551803091-e20673f15770?q=80&w=1000&auto=format&fit=crop', alt_text: 'Celestial Silk Drape Blouse Front', sort_order: 1, is_primary: true },
  { id: 'img-1-2', product_id: 'prod-1', image_url: 'https://images.unsplash.com/photo-1564257631407-4deb129f044b?q=80&w=1000&auto=format&fit=crop', alt_text: 'Celestial Silk Drape Blouse Detail', sort_order: 2, is_primary: false },
  { id: 'img-2-1', product_id: 'prod-2', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop', alt_text: 'Grand Voyager Leather Duffle Exterior', sort_order: 1, is_primary: true },
  { id: 'img-3-1', product_id: 'prod-3', image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop', alt_text: 'Obsidian Ring High Polish View', sort_order: 1, is_primary: true },
  { id: 'img-4-1', product_id: 'prod-4', image_url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=1000&auto=format&fit=crop', alt_text: 'Goodyear Oxford Pair Front Profile', sort_order: 1, is_primary: true },
];

const productVariants = [
  { id: 'var-1-1', product_id: 'prod-1', size: 'S', color: 'Champagne Ivory', color_hex: '#f5eee6', sku: 'OZ-APP-001-S-IVR', additional_price: 0, stock_quantity: 6 },
  { id: 'var-1-2', product_id: 'prod-1', size: 'M', color: 'Champagne Ivory', color_hex: '#f5eee6', sku: 'OZ-APP-001-M-IVR', additional_price: 0, stock_quantity: 10 },
  { id: 'var-1-3', product_id: 'prod-1', size: 'L', color: 'Champagne Ivory', color_hex: '#f5eee6', sku: 'OZ-APP-001-L-IVR', additional_price: 0, stock_quantity: 8 },
  { id: 'var-2-1', product_id: 'prod-2', size: 'Standard (48L)', color: 'Cognac Saddle Brown', color_hex: '#6d4327', sku: 'OZ-LEA-002-STD-BRN', additional_price: 0, stock_quantity: 8 },
  { id: 'var-2-2', product_id: 'prod-2', size: 'Standard (48L)', color: 'Midnight Noir', color_hex: '#171718', sku: 'OZ-LEA-002-STD-BLK', additional_price: 0, stock_quantity: 6 },
  { id: 'var-3-1', product_id: 'prod-3', size: 'US 8', color: '18K Yellow Gold / Obsidian', color_hex: '#e5be01', sku: 'OZ-JEW-003-8', additional_price: 0, stock_quantity: 5 },
  { id: 'var-3-2', product_id: 'prod-3', size: 'US 9', color: '18K Yellow Gold / Obsidian', color_hex: '#e5be01', sku: 'OZ-JEW-003-9', additional_price: 0, stock_quantity: 8 },
  { id: 'var-4-1', product_id: 'prod-4', size: 'EU 42', color: 'Espresso Hand-Burnished', color_hex: '#3d2b1f', sku: 'OZ-FTW-004-42', additional_price: 0, stock_quantity: 4 },
  { id: 'var-4-2', product_id: 'prod-4', size: 'EU 43', color: 'Espresso Hand-Burnished', color_hex: '#3d2b1f', sku: 'OZ-FTW-004-43', additional_price: 0, stock_quantity: 5 },
];

async function seed() {
  console.log('🌱 Seeding Supabase database with Ozeira master data...');

  // 1. Categories
  const { error: catErr } = await supabase.from('categories').upsert(categories);
  if (catErr) console.error('Category error:', catErr); else console.log('✓ Categories seeded');

  // 2. Subcategories
  const { error: subErr } = await supabase.from('subcategories').upsert(subcategories);
  if (subErr) console.error('Subcategory error:', subErr); else console.log('✓ Subcategories seeded');

  // 3. Hero Banners
  const { error: heroErr } = await supabase.from('hero_banners').upsert(heroBanners);
  if (heroErr) console.error('Hero Banner error:', heroErr); else console.log('✓ Hero Banners seeded');

  // 4. Promo Banners
  const { error: promoErr } = await supabase.from('promo_banners').upsert(promoBanners);
  if (promoErr) console.error('Promo Banner error:', promoErr); else console.log('✓ Promo Banners seeded');

  // 5. Announcements
  const { error: annErr } = await supabase.from('announcements').upsert(announcements);
  if (annErr) console.error('Announcement error:', annErr); else console.log('✓ Announcements seeded');

  // 6. Coupons
  const { error: coupErr } = await supabase.from('coupons').upsert(coupons);
  if (coupErr) console.error('Coupon error:', coupErr); else console.log('✓ Coupons seeded');

  // 7. Offers
  const { error: offErr } = await supabase.from('offers_campaigns').upsert(offers);
  if (offErr) console.error('Offer error:', offErr); else console.log('✓ Offers seeded');

  // 8. Profiles
  const { error: profErr } = await supabase.from('profiles').upsert(users);
  if (profErr) console.error('Profile error:', profErr); else console.log('✓ Profiles seeded');

  // 9. Products
  const { error: prodErr } = await supabase.from('products').upsert(products);
  if (prodErr) console.error('Product error:', prodErr); else console.log('✓ Products seeded');

  // 10. Product Images
  const { error: imgErr } = await supabase.from('product_images').upsert(productImages);
  if (imgErr) console.error('Product Images error:', imgErr); else console.log('✓ Product Images seeded');

  // 11. Product Variants
  const { error: varErr } = await supabase.from('product_variants').upsert(productVariants);
  if (varErr) console.error('Product Variants error:', varErr); else console.log('✓ Product Variants seeded');

  console.log('🎉 Supabase database seeding complete!');
}

seed();
