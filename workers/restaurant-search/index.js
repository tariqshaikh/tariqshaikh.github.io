/**
 * Waves Restaurant Search Worker
 * Proxies Google local search server-side, parses real restaurant data
 * sorted by review count — finds the local gems AI misses.
 *
 * Deploy: npx wrangler deploy
 * Free tier: 100,000 requests/day
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const destination = url.searchParams.get('destination')?.trim();

    if (!destination) {
      return json({ error: 'destination param required' }, 400);
    }

    // Cache in KV if available, otherwise skip
    const cacheKey = `restaurants:${destination.toLowerCase()}`;
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) return json(JSON.parse(cached));
    }

    const results = await fetchRestaurants(destination);

    if (env.CACHE && results.length > 0) {
      ctx.waitUntil(env.CACHE.put(cacheKey, JSON.stringify(results), { expirationTtl: 21600 }));
    }

    return json(results);
  },
};

async function fetchRestaurants(destination) {
  const query = `best restaurants in ${destination}`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=lcl&hl=en&gl=us&num=20`;

  let html;
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      cf: { cacheTtl: 0 },
    });
    html = await res.text();
  } catch {
    return [];
  }

  const results = [];

  // --- Strategy 1: JSON-LD structured data ---
  const jsonLdRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = jsonLdRe.exec(html)) !== null) {
    try {
      const raw = m[1].trim();
      const data = JSON.parse(raw);
      const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
      for (const item of items) {
        const type = item['@type'];
        if (['Restaurant', 'FoodEstablishment', 'CafeOrCoffeeShop', 'Bakery',
             'BarOrPub', 'FastFoodRestaurant', 'LocalBusiness'].includes(type)) {
          const reviewCount = parseInt(
            item.aggregateRating?.reviewCount ||
            item.aggregateRating?.ratingCount || '0'
          );
          if (item.name) {
            results.push({
              name: item.name,
              rating: parseFloat(item.aggregateRating?.ratingValue) || null,
              reviewCount,
              cuisine: item.servesCuisine || null,
              address: typeof item.address === 'string'
                ? item.address
                : item.address?.streetAddress || null,
              priceRange: item.priceRange || null,
              mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(item.name + ' ' + destination)}`,
            });
          }
        }
      }
    } catch {}
  }

  // --- Strategy 2: Inline rating/review patterns from Google local HTML ---
  // Google local results embed data like: "4.5(555)" or aria-labels
  if (results.length < 3) {
    // Extract business blocks via regex on Google's local result structure
    // Each result block contains the name near a rating pattern
    const blockRe = /class="[^"]*rllt__details[^"]*"[^>]*>([\s\S]{50,800}?)(?=class="[^"]*rllt__details|<\/div><\/div><\/div>)/g;
    while ((m = blockRe.exec(html)) !== null) {
      const block = m[1];
      const nameM = block.match(/<div[^>]*role="heading"[^>]*>([^<]{2,80})<\/div>/);
      const ratingM = block.match(/(\d\.\d)\s*\((\d[\d,]*)\)/);
      if (nameM && ratingM) {
        const name = nameM[1].replace(/&amp;/g, '&').trim();
        const reviewCount = parseInt(ratingM[2].replace(/,/g, ''));
        if (!results.find(r => r.name === name)) {
          results.push({
            name,
            rating: parseFloat(ratingM[1]),
            reviewCount,
            cuisine: null,
            address: null,
            priceRange: null,
            mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + destination)}`,
          });
        }
      }
    }
  }

  // --- Strategy 3: Aria-label pattern fallback ---
  if (results.length < 3) {
    const ariaRe = /aria-label="([^"]{5,80})"\s[^>]*>\s*<span[^>]*>[\s\S]{1,200}?Rated\s([\d.]+)[^(]*\((\d[\d,]*)\)/g;
    while ((m = ariaRe.exec(html)) !== null) {
      const name = m[1].replace(/&amp;/g, '&').trim();
      const reviewCount = parseInt(m[3].replace(/,/g, ''));
      if (!results.find(r => r.name === name)) {
        results.push({
          name,
          rating: parseFloat(m[2]),
          reviewCount,
          cuisine: null,
          address: null,
          priceRange: null,
          mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + destination)}`,
        });
      }
    }
  }

  return results
    .filter(r => r.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 10);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
