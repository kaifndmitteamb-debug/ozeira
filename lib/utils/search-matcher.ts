import { Product, Category } from '@/types';

/**
 * Common luxury fashion & accessories synonyms / aliases for semantic expansion
 */
const LUXURY_SYNONYM_MAP: Record<string, string[]> = {
  // Jewelry & precious items
  jewelery: ['jewelry', 'heirloom', 'gold', 'ring', 'pendant', 'emerald', 'watch'],
  jewellary: ['jewelry', 'heirloom', 'gold', 'ring', 'pendant', 'emerald'],
  jwellery: ['jewelry', 'heirloom', 'gold', 'ring', 'pendant'],
  jwelery: ['jewelry', 'heirloom', 'gold', 'ring', 'pendant'],
  jewels: ['jewelry', 'emerald', 'solitaire', 'gold', 'ring'],
  dimond: ['diamond', 'solitaire', 'ring', 'jewelry'],
  daimond: ['diamond', 'solitaire', 'ring', 'jewelry'],
  emrald: ['emerald', 'pendant', 'jewelry', 'solstice'],
  saphire: ['sapphire', 'jewelry', 'gemstone'],
  vermeil: ['gold', '18k', 'jewelry', 'pendant'],
  platium: ['platinum', 'signet', 'ring', 'jewelry'],
  watch: ['chronometer', 'solaris', 'horology', 'automatic'],
  watches: ['chronometer', 'solaris', 'horology', 'automatic'],
  solair: ['solaris', 'watch', 'chronometer'],
  horolagy: ['horology', 'watch', 'timepiece'],

  // Leather & Bags
  lether: ['leather', 'bag', 'duffle', 'weekender', 'backpack'],
  lather: ['leather', 'bag', 'duffle', 'weekender'],
  duffel: ['duffle', 'weekender', 'bag', 'leather'],
  duffal: ['duffle', 'weekender', 'travel', 'leather'],
  bagpack: ['backpack', 'bag', 'leather', 'canvas'],
  backpac: ['backpack', 'bag', 'canvas'],
  purse: ['bag', 'tote', 'crossbody', 'leather'],
  handbag: ['bag', 'tote', 'crossbody', 'leather'],
  totebag: ['tote', 'bag', 'leather'],
  weekndr: ['weekender', 'duffle', 'travel', 'leather'],
  florence: ['florentine', 'leather', 'weekender'],

  // Apparel & Outerwear
  trenchcot: ['trench', 'coat', 'gabardine', 'outerwear'],
  trenchcoat: ['trench', 'coat', 'gabardine', 'outerwear'],
  jaket: ['jacket', 'coat', 'outerwear', 'trench'],
  swater: ['sweater', 'cashmere', 'turtleneck', 'knitwear'],
  casmere: ['cashmere', 'sweater', 'turtleneck', 'knitwear'],
  cahsmeer: ['cashmere', 'sweater', 'turtleneck', 'knitwear'],
  kasmir: ['cashmere', 'sweater', 'turtleneck', 'mongolian'],
  tortleneck: ['turtleneck', 'cashmere', 'sweater'],
  trouser: ['trousers', 'silk', 'pleated', 'apparel'],
  trousers: ['trousers', 'silk', 'pleated', 'apparel'],
  pant: ['trousers', 'silk', 'pleated', 'apparel'],
  pants: ['trousers', 'silk', 'pleated', 'apparel'],
  dres: ['dress', 'silk', 'jacquard', 'aurelia'],
  cloth: ['apparel', 'knitwear', 'coat', 'dress', 'trousers'],
  clothes: ['apparel', 'knitwear', 'coat', 'dress', 'trousers'],
  wommen: ['women', 'dress', 'silk', 'jewelry', 'scarf'],
  womans: ['women', 'dress', 'silk', 'jewelry', 'scarf'],

  // Footwear
  boot: ['boots', 'chelsea', 'footwear', 'derby', 'ravenna'],
  bootz: ['boots', 'chelsea', 'footwear', 'ravenna'],
  botts: ['boots', 'chelsea', 'footwear', 'ravenna'],
  shoe: ['footwear', 'boots', 'chelsea', 'derby', 'loafers'],
  shoes: ['footwear', 'boots', 'chelsea', 'derby', 'loafers'],
  loafer: ['loafers', 'footwear', 'mules'],
  chelse: ['chelsea', 'boots', 'footwear', 'ravenna'],

  // Scents & Fragrances
  perfum: ['parfum', 'perfume', 'scent', 'fragrance', 'santal'],
  parfum: ['parfum', 'perfume', 'scent', 'fragrance', 'santal'],
  fragrence: ['fragrance', 'parfum', 'perfume', 'scent'],
  sent: ['scent', 'parfum', 'candle', 'fragrance', 'santal'],
  candl: ['candle', 'scent', 'fragrance', 'soy'],
  santle: ['santal', 'extrait', 'parfum', 'fragrance'],

  // Accessories
  sunglas: ['sunglasses', 'aviator', 'spectacles', 'verona', 'titanium'],
  sunglass: ['sunglasses', 'aviator', 'spectacles', 'verona', 'titanium'],
  spectacle: ['sunglasses', 'aviator', 'titanium', 'frames'],
  scarff: ['scarf', 'silk', 'twill', 'palazzo'],
  scarfs: ['scarf', 'silk', 'twill', 'palazzo'],
};

/**
 * Popular curated search terms for zero-query / discovery popover
 */
export const POPULAR_SEARCH_TERMS = [
  'Trench Coat',
  'Full-Grain Leather Weekender',
  '18K Gold Emerald Pendant',
  'Mongolian Cashmere',
  'Chelsea Boots',
  'Obsidian Signet Ring',
  'Grand Santal Parfum',
  'Pure Silk Trousers',
  'Aviator Sunglasses',
  'Silk Twill Scarf',
];

/**
 * Calculates Damerau-Levenshtein edit distance (supports transpositions)
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const matrix: number[][] = [];

  for (let i = 0; i <= la; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lb; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let min = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        min = Math.min(min, matrix[i - 2][j - 2] + 1);
      }

      matrix[i][j] = min;
    }
  }

  return matrix[la][lb];
}

/**
 * Returns a normalized similarity score between 0 and 1
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length >= s2.length ? s1 : s2;
  const shorter = s1.length < s2.length ? s1 : s2;
  if (longer.length === 0) return 1.0;
  const distance = calculateLevenshteinDistance(s1, s2);
  return (longer.length - distance) / longer.length;
}

/**
 * Checks if query token matches target token via exact, prefix, substring, or typo tolerance
 */
export function isFuzzyTokenMatch(queryToken: string, targetToken: string): { match: boolean; score: number } {
  const q = queryToken.toLowerCase().trim();
  const t = targetToken.toLowerCase().trim();

  if (!q || !t) return { match: false, score: 0 };

  // 1. Exact match
  if (q === t) return { match: true, score: 100 };

  // 2. Target starts with query (Prefix match)
  if (t.startsWith(q)) {
    const ratio = q.length / t.length;
    return { match: true, score: 80 + Math.round(ratio * 15) };
  }

  // 3. Substring match
  if (t.includes(q)) {
    return { match: true, score: 65 };
  }

  // 4. Synonym / alias lookup
  const synonyms = LUXURY_SYNONYM_MAP[q];
  if (synonyms && synonyms.some((syn) => syn === t || t.includes(syn) || syn.includes(t))) {
    return { match: true, score: 85 };
  }

  // 5. Typo edit distance check
  const maxAllowedDistance = q.length <= 3 ? 1 : q.length <= 6 ? 2 : 3;
  const distance = calculateLevenshteinDistance(q, t);

  if (distance <= maxAllowedDistance) {
    const similarity = 1 - distance / Math.max(q.length, t.length);
    return { match: true, score: Math.round(50 + similarity * 35) };
  }

  return { match: false, score: 0 };
}

export interface MatchResult {
  product: Product;
  score: number;
  highlightReasons: string[];
}

/**
 * Scores and filters a list of products against a search query with full typo tolerance
 */
export function fuzzySearchProducts(
  products: Product[],
  rawQuery: string,
  minScoreThreshold = 40
): { results: Product[]; matchedScores: Map<string, number>; didYouMean?: string } {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return { results: products, matchedScores: new Map() };
  }

  const queryTokens = query.split(/\s+/).filter(Boolean);
  const scoredProducts: MatchResult[] = [];
  const matchedScores = new Map<string, number>();

  for (const product of products) {
    let totalScore = 0;
    const reasons: string[] = [];

    // Searchable text corpus from product
    const title = product.title.toLowerCase();
    const titleTokens = title.split(/\s+/).filter(Boolean);
    const category = (product.category_name || '').toLowerCase();
    const brand = (product.brand || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const tags = (product.tags || []).map((t) => t.toLowerCase());

    // Check query tokens against product fields
    let tokensMatchedCount = 0;

    for (const qToken of queryTokens) {
      let bestTokenScore = 0;
      let reason = '';

      // Direct full title check
      if (title.includes(qToken)) {
        bestTokenScore = Math.max(bestTokenScore, 90);
        reason = 'title exact/partial match';
      }

      // Token vs title tokens
      for (const tToken of titleTokens) {
        const { match, score } = isFuzzyTokenMatch(qToken, tToken);
        if (match && score > bestTokenScore) {
          bestTokenScore = score;
          reason = `title "${tToken}" fuzzy match`;
        }
      }

      // Check category
      const { match: catMatch, score: catScore } = isFuzzyTokenMatch(qToken, category);
      if (catMatch && catScore > bestTokenScore) {
        bestTokenScore = catScore * 0.9;
        reason = `category "${category}" match`;
      }

      // Check brand
      const { match: brandMatch, score: brandScore } = isFuzzyTokenMatch(qToken, brand);
      if (brandMatch && brandScore > bestTokenScore) {
        bestTokenScore = brandScore * 0.85;
        reason = `brand "${brand}" match`;
      }

      // Check tags
      for (const tag of tags) {
        const { match: tagMatch, score: tagScore } = isFuzzyTokenMatch(qToken, tag);
        if (tagMatch && tagScore > bestTokenScore) {
          bestTokenScore = tagScore * 0.8;
          reason = `tag "${tag}" match`;
        }
      }

      // Check description
      if (description.includes(qToken)) {
        bestTokenScore = Math.max(bestTokenScore, 50);
        if (!reason) reason = 'description match';
      }

      if (bestTokenScore >= minScoreThreshold) {
        tokensMatchedCount++;
        totalScore += bestTokenScore;
        if (reason) reasons.push(reason);
      }
    }

    // Boost if all tokens matched
    if (tokensMatchedCount === queryTokens.length) {
      totalScore += 25 * tokensMatchedCount;
    }

    // Boost featured and bestsellers slightly
    if (product.is_featured) totalScore += 5;
    if (product.rating_avg >= 4.8) totalScore += 3;

    if (totalScore >= minScoreThreshold && tokensMatchedCount > 0) {
      scoredProducts.push({
        product,
        score: totalScore,
        highlightReasons: reasons,
      });
      matchedScores.set(product.id, totalScore);
    }
  }

  // Sort by score descending
  scoredProducts.sort((a, b) => b.score - a.score);

  // Determine "Did you mean?" suggestion
  const didYouMean = generateSpellCorrection(query, products);

  return {
    results: scoredProducts.map((sp) => sp.product),
    matchedScores,
    didYouMean: didYouMean !== query ? didYouMean : undefined,
  };
}

/**
 * Builds vocabulary index from catalog to suggest closest correct spelling
 */
export function generateSpellCorrection(query: string, products: Product[]): string | undefined {
  const cleanQuery = query.toLowerCase().trim();
  if (cleanQuery.length < 3) return undefined;

  // Build unique valid dictionary from catalog (only valid terms, not typo keys)
  const vocabulary = new Set<string>();

  // Add correct synonym targets
  Object.values(LUXURY_SYNONYM_MAP).flat().forEach((val) => vocabulary.add(val));

  // Add product titles and categories words
  products.forEach((p) => {
    p.title.toLowerCase().split(/\s+/).forEach((w) => {
      const cleanW = w.replace(/[^a-z0-9]/g, '');
      if (cleanW.length >= 3) vocabulary.add(cleanW);
    });
    if (p.category_name) {
      p.category_name.toLowerCase().split(/\s+/).forEach((w) => {
        const cleanW = w.replace(/[^a-z0-9]/g, '');
        if (cleanW.length >= 3) vocabulary.add(cleanW);
      });
    }
    p.tags?.forEach((tag) => {
      vocabulary.add(tag.toLowerCase());
    });
  });

  const queryWords = cleanQuery.split(/\s+/);
  let hasCorrection = false;
  const correctedWords: string[] = [];

  for (const qWord of queryWords) {
    // 1. Check known typo / synonym map first
    if (LUXURY_SYNONYM_MAP[qWord]) {
      const target = LUXURY_SYNONYM_MAP[qWord][0];
      correctedWords.push(target);
      if (target !== qWord) hasCorrection = true;
      continue;
    }

    // 2. Check if already a valid vocabulary word
    if (vocabulary.has(qWord)) {
      correctedWords.push(qWord);
      continue;
    }

    // Find best fuzzy match in vocabulary
    let bestWord = qWord;
    let bestDist = 999;
    let bestSim = 0;

    vocabulary.forEach((dictWord) => {
      const dist = calculateLevenshteinDistance(qWord, dictWord);
      const sim = calculateSimilarity(qWord, dictWord);
      const maxAllowed = qWord.length <= 4 ? 1 : 2;

      if (dist <= maxAllowed && sim > bestSim) {
        bestSim = sim;
        bestDist = dist;
        bestWord = dictWord;
      }
    });

    if (bestWord !== qWord && bestSim >= 0.6) {
      correctedWords.push(bestWord);
      hasCorrection = true;
    } else {
      correctedWords.push(qWord);
    }
  }

  if (hasCorrection) {
    return correctedWords.join(' ');
  }

  return undefined;
}

/**
 * Filter matching categories for dynamic quick links
 */
export function getMatchingCategories(
  categories: Category[],
  query: string
): { category: Category; subcategory?: { id: string; name: string; slug: string } }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: { category: Category; subcategory?: { id: string; name: string; slug: string } }[] = [];

  for (const cat of categories) {
    const catName = cat.name.toLowerCase();
    const { match: catMatch } = isFuzzyTokenMatch(q, catName);

    if (catMatch || catName.includes(q)) {
      results.push({ category: cat });
    }

    // Check subcategories
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        const subName = sub.name.toLowerCase();
        const { match: subMatch } = isFuzzyTokenMatch(q, subName);
        if (subMatch || subName.includes(q)) {
          results.push({ category: cat, subcategory: sub });
        }
      }
    }
  }

  return results.slice(0, 3);
}

/**
 * Local storage manager for recent user searches
 */
const RECENT_SEARCHES_KEY = 'ozeira_recent_searches_v1';

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): string[] {
  if (typeof window === 'undefined') return [];
  const clean = query.trim();
  if (!clean || clean.length < 2) return getRecentSearches();

  try {
    const current = getRecentSearches().filter((q) => q.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...current].slice(0, 6);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {}
}
