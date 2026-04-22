import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ─── NLP Utilities ──────────────────────────────────────────────

// Common stop words to ignore
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'and', 'or', 'but',
  'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'this', 'that',
  'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'i', 'me',
  'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'how',
  'very', 'really', 'just', 'also', 'only', 'some', 'any', 'much', 'many', 'few',
  'found', 'lost', 'item', 'near', 'around',
]);

// Color synonym groups
const COLOR_SYNONYMS: Record<string, string[]> = {
  black: ['dark', 'jet', 'ebony', 'onyx', 'charcoal'],
  white: ['ivory', 'cream', 'pearl', 'snow'],
  red: ['crimson', 'scarlet', 'maroon', 'ruby', 'burgundy', 'cherry'],
  blue: ['navy', 'azure', 'cobalt', 'sapphire', 'indigo', 'cyan', 'teal'],
  green: ['olive', 'emerald', 'lime', 'forest', 'sage', 'mint'],
  grey: ['gray', 'silver', 'slate', 'ash', 'graphite', 'space grey', 'space gray'],
  gold: ['golden', 'champagne', 'bronze'],
  pink: ['rose', 'salmon', 'coral', 'magenta', 'fuchsia'],
  brown: ['tan', 'beige', 'khaki', 'chocolate', 'coffee', 'mocha', 'camel'],
  purple: ['violet', 'lavender', 'plum', 'mauve', 'amethyst'],
  orange: ['tangerine', 'amber', 'rust', 'copper'],
  yellow: ['lemon', 'mustard', 'honey'],
};

// Category-aware synonym groups
const CATEGORY_TERMS: Record<string, string[]> = {
  ELECTRONICS: ['phone', 'laptop', 'tablet', 'charger', 'earphone', 'earbuds', 'airpods', 'headphone', 'cable', 'adapter', 'mouse', 'keyboard', 'pendrive', 'usb', 'camera', 'watch', 'smartwatch', 'iphone', 'ipad', 'macbook', 'samsung', 'dell', 'hp', 'lenovo', 'powerbank'],
  CLOTHING: ['shirt', 'jacket', 'hoodie', 'sweater', 'trouser', 'pant', 'jeans', 'shoe', 'sneaker', 'cap', 'hat', 'scarf', 'glove', 'coat', 'blazer', 'dress', 'sweatshirt'],
  ACCESSORIES: ['bag', 'backpack', 'purse', 'belt', 'ring', 'bracelet', 'necklace', 'chain', 'earring', 'glasses', 'sunglasses', 'watch', 'umbrella', 'pouch'],
  BOOKS: ['book', 'notebook', 'textbook', 'novel', 'diary', 'journal', 'planner', 'register', 'copy'],
  STATIONERY: ['pen', 'pencil', 'eraser', 'ruler', 'calculator', 'marker', 'highlighter', 'stapler', 'scissors'],
  KEYS: ['key', 'keychain', 'keyring', 'car key', 'room key', 'locker key', 'padlock'],
  WALLET: ['wallet', 'purse', 'cardholder', 'money', 'cash', 'card', 'atm'],
  ID_CARD: ['id', 'identity', 'card', 'badge', 'student id', 'college id', 'hall ticket', 'admit card', 'pass', 'license', 'driving license', 'aadhaar', 'pan'],
  SPORTS: ['ball', 'bat', 'racket', 'racquet', 'glove', 'helmet', 'bottle', 'sipper', 'jersey', 'shin guard', 'football', 'cricket', 'basketball', 'shuttlecock'],
  OTHER: [],
};

// Tokenize and clean a string
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

// Generate bigrams for better phrase matching
function bigrams(tokens: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    result.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return result;
}

// Check if two colors are semantically similar
function colorsMatch(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const al = a.toLowerCase().trim();
  const bl = b.toLowerCase().trim();
  if (al === bl) return true;
  for (const [base, synonyms] of Object.entries(COLOR_SYNONYMS)) {
    const group = [base, ...synonyms];
    const aMatches = group.some((s) => al.includes(s));
    const bMatches = group.some((s) => bl.includes(s));
    if (aMatches && bMatches) return true;
  }
  return false;
}

// TF-IDF-inspired similarity
function semanticSimilarity(textA: string, textB: string): number {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  // Unigram overlap (weighted by rarity)
  const allTokens = [...tokensA, ...tokensB];
  const freq: Record<string, number> = {};
  allTokens.forEach((t) => { freq[t] = (freq[t] || 0) + 1; });

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let weightedOverlap = 0;
  let totalWeight = 0;

  setA.forEach((token) => {
    const idf = Math.log(allTokens.length / (freq[token] || 1));
    totalWeight += idf;
    if (setB.has(token)) {
      weightedOverlap += idf;
    }
  });

  const unigramScore = totalWeight > 0 ? weightedOverlap / totalWeight : 0;

  // Bigram overlap
  const biA = new Set(bigrams(tokensA));
  const biB = new Set(bigrams(tokensB));
  let bigramOverlap = 0;
  biA.forEach((bi) => { if (biB.has(bi)) bigramOverlap++; });
  const bigramScore = (biA.size + biB.size) > 0
    ? (2 * bigramOverlap) / (biA.size + biB.size) : 0;

  return unigramScore * 0.6 + bigramScore * 0.4;
}

// Date proximity score (items found within a few days are more likely matches)
function dateProximity(dateA: Date, dateB: Date): number {
  const diffDays = Math.abs(dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 1) return 1.0;
  if (diffDays <= 3) return 0.8;
  if (diffDays <= 7) return 0.5;
  if (diffDays <= 14) return 0.3;
  if (diffDays <= 30) return 0.1;
  return 0;
}

// ─── Match Engine ───────────────────────────────────────────────

interface MatchResult {
  lostItem: any;
  foundItem: any;
  score: number;
  reasons: { factor: string; weight: string; icon: string }[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

function computeMatches(lostItems: any[], foundItems: any[]): MatchResult[] {
  const results: MatchResult[] = [];

  for (const lost of lostItems) {
    for (const found of foundItems) {
      const reasons: { factor: string; weight: string; icon: string }[] = [];
      let score = 0;

      // 1. Serial Number match — definitive identification
      if (lost.serialNumber && found.serialNumber &&
          lost.serialNumber.toLowerCase().trim() === found.serialNumber.toLowerCase().trim()) {
        score += 0.9;
        reasons.push({ factor: 'Serial number / ID match', weight: 'Definitive', icon: '🔑' });
      }

      // 2. Category match — strong structural signal
      if (lost.category === found.category) {
        score += 0.25;
        reasons.push({ factor: `Same category: ${lost.category.replace('_', ' ')}`, weight: 'Strong', icon: '📂' });
      } else {
        // Category mismatch is a strong negative signal — skip low-probability combinations
        score -= 0.1;
      }

      // 3. Brand match
      if (lost.brand && found.brand) {
        if (lost.brand.toLowerCase().trim() === found.brand.toLowerCase().trim()) {
          score += 0.2;
          reasons.push({ factor: `Brand match: ${lost.brand}`, weight: 'Strong', icon: '🏷️' });
        } else {
          const sim = semanticSimilarity(lost.brand, found.brand);
          if (sim > 0.3) {
            score += sim * 0.12;
            reasons.push({ factor: 'Similar brand name', weight: 'Moderate', icon: '🏷️' });
          }
        }
      }

      // 4. Color match (with synonym awareness)
      if (colorsMatch(lost.color, found.color)) {
        score += 0.15;
        reasons.push({ factor: `Color match: ${lost.color}`, weight: 'Moderate', icon: '🎨' });
      }

      // 5. Title similarity (most important text signal)
      const titleSim = semanticSimilarity(lost.title, found.title);
      if (titleSim > 0.15) {
        score += titleSim * 0.25;
        reasons.push({ factor: `Title similarity: ${Math.round(titleSim * 100)}%`, weight: titleSim > 0.4 ? 'Strong' : 'Moderate', icon: '📝' });
      }

      // 6. Description similarity
      const descSim = semanticSimilarity(lost.description, found.description);
      if (descSim > 0.1) {
        score += descSim * 0.15;
        reasons.push({ factor: `Description overlap: ${Math.round(descSim * 100)}%`, weight: descSim > 0.3 ? 'Moderate' : 'Weak', icon: '📄' });
      }

      // 7. Location similarity
      const locSim = semanticSimilarity(lost.location, found.location);
      if (locSim > 0.2) {
        score += locSim * 0.1;
        reasons.push({ factor: 'Similar location', weight: 'Moderate', icon: '📍' });
      } else if (
        found.location.toLowerCase().includes(lost.location.toLowerCase()) ||
        lost.location.toLowerCase().includes(found.location.toLowerCase())
      ) {
        score += 0.08;
        reasons.push({ factor: 'Overlapping location', weight: 'Weak', icon: '📍' });
      }

      // 8. Date proximity
      const dateSim = dateProximity(new Date(lost.date), new Date(found.date));
      if (dateSim > 0.3) {
        score += dateSim * 0.08;
        reasons.push({ factor: `Found within ${Math.ceil(Math.abs(new Date(lost.date).getTime() - new Date(found.date).getTime()) / (1000 * 60 * 60 * 24))} days`, weight: dateSim > 0.7 ? 'Moderate' : 'Weak', icon: '📅' });
      }

      // 9. Tag overlap
      const sharedTags = (lost.tags || []).filter((t: string) => (found.tags || []).includes(t));
      if (sharedTags.length > 0) {
        score += sharedTags.length * 0.04;
        reasons.push({ factor: `Shared tags: ${sharedTags.join(', ')}`, weight: 'Weak', icon: '🏷️' });
      }

      // 10. Cross-field text matching (title vs description and vice versa)
      const crossSim1 = semanticSimilarity(lost.title, found.description);
      const crossSim2 = semanticSimilarity(lost.description, found.title);
      const crossMax = Math.max(crossSim1, crossSim2);
      if (crossMax > 0.15) {
        score += crossMax * 0.08;
        reasons.push({ factor: 'Cross-field text match', weight: 'Weak', icon: '🔀' });
      }

      // Threshold and build result
      if (score >= 0.2 && reasons.length >= 2) {
        const finalScore = Math.min(score, 1);
        results.push({
          lostItem: lost,
          foundItem: found,
          score: finalScore,
          reasons,
          confidence: finalScore >= 0.6 ? 'HIGH' : finalScore >= 0.35 ? 'MEDIUM' : 'LOW',
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 30);
}

// ─── Search Engine ──────────────────────────────────────────────

function searchItems(items: any[], query: string) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return items;

  const scored = items.map((item) => {
    const combined = `${item.title} ${item.description} ${item.category} ${item.brand || ''} ${item.color || ''} ${item.location} ${(item.tags || []).join(' ')}`;
    const sim = semanticSimilarity(query, combined);
    return { item, score: sim };
  });

  return scored
    .filter((s) => s.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);
}

// ─── API Routes ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const mode = searchParams.get('mode') || 'auto'; // auto | lost | found | search

    const userSelect = { select: { id: true, name: true, email: true, avatar: true, department: true, phone: true } };

    if (mode === 'search' && query) {
      // Free-text search — search all active items on the same campus
      const allItems = await prisma.item.findMany({
        where: {
          status: { in: ['ACTIVE', 'PENDING_CLAIM'] as any },
          campus: session.user.campus,
        },
        include: { user: userSelect },
        orderBy: { createdAt: 'desc' },
      });

      const results = searchItems(allItems, query);
      return NextResponse.json({ matches: [], searchResults: results, mode: 'search', query });
    }

    // ── Auto-match mode ──
    // Get the user's items
    const userLostItems = await prisma.item.findMany({
      where: { userId: session.user.id, type: 'LOST', status: 'ACTIVE' },
      include: { user: userSelect },
    });

    const userFoundItems = await prisma.item.findMany({
      where: { userId: session.user.id, type: 'FOUND', status: 'ACTIVE' },
      include: { user: userSelect },
    });

    // Get counterpart items from others on the same campus
    const othersFoundItems = await prisma.item.findMany({
      where: {
        type: 'FOUND',
        status: { in: ['ACTIVE', 'PENDING_CLAIM'] as any },
        userId: { not: session.user.id },
        campus: session.user.campus,
      },
      include: { user: userSelect },
    });

    const othersLostItems = await prisma.item.findMany({
      where: {
        type: 'LOST',
        status: 'ACTIVE',
        userId: { not: session.user.id },
        campus: session.user.campus,
      },
      include: { user: userSelect },
    });

    // Match user's LOST items → others' FOUND items
    const lostMatches = computeMatches(userLostItems, othersFoundItems);

    // Match user's FOUND items → others' LOST items (reverse)
    const foundMatches = computeMatches(othersLostItems, userFoundItems).map((m) => ({
      ...m,
      // Swap to keep "your item" perspective consistent
      lostItem: m.lostItem,
      foundItem: m.foundItem,
      isReverse: true,
    }));

    // Apply search filter if query is provided
    let filteredLost = lostMatches;
    let filteredFound = foundMatches;
    if (query) {
      const q = query.toLowerCase();
      filteredLost = lostMatches.filter((m) =>
        m.lostItem.title.toLowerCase().includes(q) ||
        m.foundItem.title.toLowerCase().includes(q) ||
        m.lostItem.description.toLowerCase().includes(q)
      );
      filteredFound = foundMatches.filter((m: any) =>
        m.lostItem.title.toLowerCase().includes(q) ||
        m.foundItem.title.toLowerCase().includes(q) ||
        m.foundItem.description.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      matches: filteredLost,
      reverseMatches: filteredFound,
      stats: {
        yourLostItems: userLostItems.length,
        yourFoundItems: userFoundItems.length,
        totalFoundOnCampus: othersFoundItems.length,
        totalLostOnCampus: othersLostItems.length,
        matchesFound: filteredLost.length + filteredFound.length,
      },
      mode: 'auto',
    });
  } catch (error) {
    console.error('GET /api/matches error:', error);
    return NextResponse.json({ error: 'Failed to compute matches' }, { status: 500 });
  }
}
