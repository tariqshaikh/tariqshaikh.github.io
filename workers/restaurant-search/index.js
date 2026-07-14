/**
 * Waves Restaurant Search Worker — powered by Foursquare Places API
 * Returns real restaurants sorted by total ratings (review count).
 * Deploy: npx wrangler deploy
 * Set key: npx wrangler secret put FSQ_API_KEY
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

    if (!env.FSQ_API_KEY) {
      return json({ error: 'FSQ_API_KEY secret not set' }, 500);
    }

    // KV cache — 6 hour TTL
    const cacheKey = `fsq:${destination.toLowerCase()}`;
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) return json(JSON.parse(cached));
    }

    const results = await fetchFromFoursquare(destination, env.FSQ_API_KEY);

    if (env.CACHE && results.length > 0) {
      ctx.waitUntil(
        env.CACHE.put(cacheKey, JSON.stringify(results), { expirationTtl: 21600 })
      );
    }

    return json(results);
  },
};

async function fetchFromFoursquare(destination, apiKey) {
  const params = new URLSearchParams({
    near: destination,
    categories: '13000', // Food & Drink (all restaurants)
    sort: 'RELEVANCE',
    limit: '20',
    fields: 'name,rating,stats,location,price,categories',
  });

  const res = await fetch(
    `https://api.foursquare.com/v3/places/search?${params}`,
    {
      headers: {
        Authorization: apiKey,
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    console.error('Foursquare error:', res.status, await res.text());
    return [];
  }

  const data = await res.json();

  return (data.results || [])
    .map(place => ({
      name: place.name,
      // Foursquare rates 0–10, convert to 0–5
      rating: place.rating ? Math.round((place.rating / 2) * 10) / 10 : null,
      reviewCount: place.stats?.total_ratings ?? 0,
      cuisine: place.categories?.[0]?.name ?? null,
      address: place.location?.address ?? place.location?.locality ?? null,
      neighborhood: place.location?.neighborhood?.[0] ?? place.location?.locality ?? null,
      priceRange: place.price ? '$'.repeat(place.price) : null,
      mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + destination)}`,
    }))
    .filter(p => p.reviewCount > 0)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 10);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
