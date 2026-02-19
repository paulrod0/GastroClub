/**
 * Extractor de información de restaurantes desde URLs
 *
 * Soporta:
 *  - Google Maps  (maps.google.com, goo.gl/maps, maps.app.goo.gl)
 *  - Apple Maps   (maps.apple.com)
 *  - TheFork      (thefork.es, thefork.com)
 *  - TripAdvisor  (tripadvisor.es, tripadvisor.com)
 *  - Cualquier URL: intenta extraer nombre + geocodificar con Nominatim
 */

const https = require('https');
const http  = require('http');
const { URL } = require('url');

// ── Helpers ────────────────────────────────────────────────────────────────

function fetchText(urlStr, opts = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(urlStr);
        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Gastronomos-Bot/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'es-ES,es;q=0.9',
                ...opts.headers,
            },
            timeout: 10000,
        };
        const req = lib.request(options, (res) => {
            // Follow redirects (up to 5)
            if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308)
                && res.headers.location) {
                const redirectUrl = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : `${parsedUrl.protocol}//${parsedUrl.hostname}${res.headers.location}`;
                return fetchText(redirectUrl, opts).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ body: data, url: urlStr, statusCode: res.statusCode }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
        req.end();
    });
}

function fetchJson(url) {
    return fetchText(url, { headers: { 'Accept': 'application/json' } })
        .then(({ body }) => JSON.parse(body));
}

function extractMetaTag(html, property) {
    // Try og: first, then name=
    const ogMatch = html.match(new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i'));
    if (ogMatch) return ogMatch[1];
    const nameMatch = html.match(new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'));
    if (nameMatch) return nameMatch[1];
    return null;
}

function extractTitle(html) {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return m ? m[1].trim() : null;
}

// ── Nominatim geocoding ───────────────────────────────────────────────────

async function geocodeNominatim(query) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&extratags=1`;
        const data = await fetchJson(url);
        if (!data || data.length === 0) return null;
        const place = data[0];
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);
        return {
            lat,
            lng,
            address: place.display_name,
            googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
            appleMapsUrl:  `https://maps.apple.com/?q=${encodeURIComponent(query)}&ll=${lat},${lng}`,
            website: place.extratags?.website || place.extratags?.url || null,
        };
    } catch (e) {
        console.error('[Nominatim] error:', e.message);
        return null;
    }
}

// ── Google Maps URL parser ────────────────────────────────────────────────

function parseGoogleMapsCoords(urlStr) {
    // Pattern: @lat,lng or /search/lat,lng or ?q=lat,lng
    const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /\?q=(-?\d+\.\d+),(-?\d+\.\d+)/,
        /\/(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];
    for (const p of patterns) {
        const m = urlStr.match(p);
        if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
    }
    return null;
}

function parseGoogleMapsPlaceName(urlStr) {
    // /maps/place/PLACE+NAME/@...
    const m = urlStr.match(/\/maps\/(?:place|search)\/([^/@?]+)/);
    if (m) return decodeURIComponent(m[1].replace(/\+/g, ' '));
    // ?q=PLACE
    const q = new URL(urlStr).searchParams.get('q');
    if (q) return q;
    return null;
}

async function extractFromGoogleMaps(urlStr) {
    try {
        // First expand short URLs (goo.gl/maps, maps.app.goo.gl)
        let fullUrl = urlStr;
        if (urlStr.includes('goo.gl') || urlStr.includes('maps.app.goo.gl')) {
            try {
                const result = await fetchText(urlStr);
                fullUrl = result.url; // after redirects
            } catch (e) {
                // keep original
            }
        }

        const name = parseGoogleMapsPlaceName(fullUrl);
        const coords = parseGoogleMapsCoords(fullUrl);

        if (coords) {
            const lat = coords.lat, lng = coords.lng;
            const geo = name ? await geocodeNominatim(name) : null;
            return {
                name: name || null,
                address: geo?.address || `${lat}, ${lng}`,
                lat,
                lng,
                googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
                appleMapsUrl:  `https://maps.apple.com/?q=${encodeURIComponent(name || '')}&ll=${lat},${lng}`,
                website: geo?.website || null,
            };
        }

        if (name) {
            const geo = await geocodeNominatim(name);
            if (geo) {
                return {
                    name,
                    address: geo.address,
                    lat: geo.lat,
                    lng: geo.lng,
                    googleMapsUrl: geo.googleMapsUrl,
                    appleMapsUrl:  geo.appleMapsUrl,
                    website: geo.website,
                };
            }
        }
    } catch (e) {
        console.error('[GoogleMaps] error:', e.message);
    }
    return null;
}

// ── TheFork parser ────────────────────────────────────────────────────────

async function extractFromTheFork(urlStr) {
    try {
        const { body } = await fetchText(urlStr);
        const name = extractMetaTag(body, 'title') || extractTitle(body);
        const description = extractMetaTag(body, 'description');
        const cleanName = name ? name.replace(/\s*[-|].*thefork.*/i, '').trim() : null;

        if (!cleanName) return null;

        const geo = await geocodeNominatim(cleanName);

        // Try to extract website from page
        const websiteMatch = body.match(/href=["'](https?:\/\/(?!.*thefork)[^"']+)["'][^>]*>(?:.*?sitio web|.*?website)/i);
        const website = websiteMatch ? websiteMatch[1] : geo?.website || null;

        return {
            name: cleanName,
            description: description ? description.substring(0, 200) : null,
            address: geo?.address || null,
            lat: geo?.lat || null,
            lng: geo?.lng || null,
            googleMapsUrl: geo?.googleMapsUrl || null,
            appleMapsUrl:  geo?.appleMapsUrl  || null,
            website,
        };
    } catch (e) {
        console.error('[TheFork] error:', e.message);
    }
    return null;
}

// ── TripAdvisor parser ────────────────────────────────────────────────────

async function extractFromTripAdvisor(urlStr) {
    try {
        const { body } = await fetchText(urlStr);
        const name = extractMetaTag(body, 'title') || extractTitle(body);
        const description = extractMetaTag(body, 'description');
        const cleanName = name ? name.replace(/\s*[-|].*tripadvisor.*/i, '').trim() : null;

        if (!cleanName) return null;

        const geo = await geocodeNominatim(cleanName);

        return {
            name: cleanName,
            description: description ? description.substring(0, 200) : null,
            address: geo?.address || null,
            lat: geo?.lat || null,
            lng: geo?.lng || null,
            googleMapsUrl: geo?.googleMapsUrl || null,
            appleMapsUrl:  geo?.appleMapsUrl  || null,
            website: null,
        };
    } catch (e) {
        console.error('[TripAdvisor] error:', e.message);
    }
    return null;
}

// ── Generic URL parser ────────────────────────────────────────────────────

async function extractFromGenericUrl(urlStr) {
    try {
        const { body } = await fetchText(urlStr);
        const name = extractMetaTag(body, 'title') || extractTitle(body);
        const description = extractMetaTag(body, 'description');
        const cleanName = name ? name.split(/[-|–]/)[0].trim() : null;

        if (!cleanName || cleanName.length < 3) return null;

        const geo = await geocodeNominatim(cleanName);

        return {
            name: cleanName,
            description: description ? description.substring(0, 200) : null,
            address: geo?.address || null,
            lat: geo?.lat || null,
            lng: geo?.lng || null,
            googleMapsUrl: geo?.googleMapsUrl || null,
            appleMapsUrl:  geo?.appleMapsUrl  || null,
            website: urlStr,
        };
    } catch (e) {
        console.error('[GenericURL] error:', e.message);
    }
    return null;
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * Extrae información de restaurante desde una URL.
 * Devuelve objeto con: name, address, lat, lng, googleMapsUrl, appleMapsUrl, website, description
 * o null si no se pudo extraer.
 */
async function extractRestaurantFromUrl(urlStr) {
    let parsedUrl;
    try {
        parsedUrl = new URL(urlStr.trim());
    } catch {
        return null;
    }

    const host = parsedUrl.hostname.toLowerCase().replace('www.', '');

    if (host.includes('google.com/maps') || host === 'goo.gl' || host === 'maps.app.goo.gl' || host.includes('maps.google')) {
        return extractFromGoogleMaps(urlStr);
    }

    if (host.includes('thefork.')) {
        return extractFromTheFork(urlStr);
    }

    if (host.includes('tripadvisor.')) {
        return extractFromTripAdvisor(urlStr);
    }

    if (host.includes('maps.apple.com')) {
        const q = parsedUrl.searchParams.get('q');
        if (q) {
            const geo = await geocodeNominatim(q);
            if (geo) {
                return {
                    name: q,
                    address: geo.address,
                    lat: geo.lat,
                    lng: geo.lng,
                    googleMapsUrl: geo.googleMapsUrl,
                    appleMapsUrl:  `https://maps.apple.com/?q=${encodeURIComponent(q)}`,
                    website: geo.website,
                    description: null,
                };
            }
        }
        return null;
    }

    // Fallback: fetch page and try og:title / title
    return extractFromGenericUrl(urlStr);
}

/**
 * Detecta todas las URLs en un mensaje de texto.
 */
function extractUrls(text) {
    const urlRegex = /https?:\/\/[^\s<>"]+/gi;
    return (text.match(urlRegex) || []).filter(url => {
        try { new URL(url); return true; } catch { return false; }
    });
}

/**
 * Dado un texto de mensaje, devuelve la primera URL que parece de restaurante
 * y el objeto de información extraída, o null si no hay nada.
 */
async function detectRestaurantInMessage(text) {
    const urls = extractUrls(text);
    if (urls.length === 0) return null;

    const restaurantDomains = [
        'google.com/maps', 'maps.google', 'goo.gl', 'maps.app.goo.gl',
        'maps.apple.com',
        'thefork.', 'tripadvisor.', 'yelp.com',
        'restaurantes.com', 'eltenedor.', 'opentable.',
        'michelin.', 'zagat.',
    ];

    // Prioritize known restaurant domains
    const prioritized = [
        ...urls.filter(u => restaurantDomains.some(d => u.includes(d))),
        ...urls.filter(u => !restaurantDomains.some(d => u.includes(d))),
    ];

    for (const url of prioritized) {
        const info = await extractRestaurantFromUrl(url);
        if (info && info.name) {
            return { url, info };
        }
    }

    return null;
}

module.exports = { extractRestaurantFromUrl, detectRestaurantInMessage, extractUrls };
