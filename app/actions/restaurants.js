'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

export async function getRestaurants() {
    return await prisma.restaurant.findMany({
        include: { addedBy: true },
        orderBy: { createdAt: 'desc' },
    });
}

export async function addRestaurant(formData) {
    const user = await getCurrentUser();
    if (!user) return { error: 'No autorizado' };

    const name = formData.get('name');
    const url = formData.get('url') || null;
    const address = formData.get('address') || null;
    const description = formData.get('description') || null;
    const cuisine = formData.get('cuisine') || null;
    const priceRange = parseInt(formData.get('priceRange')) || null;
    const lat = parseFloat(formData.get('lat')) || null;
    const lng = parseFloat(formData.get('lng')) || null;
    const googleMapsUrl = formData.get('googleMapsUrl') || null;
    const appleMapsUrl = formData.get('appleMapsUrl') || null;

    try {
        // Check for duplicates (same name and address)
        if (address) {
            const existing = await prisma.restaurant.findFirst({
                where: { name, address },
            });
            if (existing) return { error: 'Este restaurante ya ha sido añadido.' };
        }

        await prisma.restaurant.create({
            data: {
                name,
                url,
                address,
                description,
                cuisine,
                priceRange,
                latitude: lat,
                longitude: lng,
                googleMapsUrl,
                appleMapsUrl,
                userId: user.id,
            },
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Add restaurant error:', error);
        return { error: 'Error al añadir el restaurante.' };
    }
}

/**
 * Extrae información de restaurante desde una URL pegada por el usuario.
 * Soporta: Google Maps, goo.gl/maps, maps.app.goo.gl, Apple Maps,
 *          TheFork, TripAdvisor y cualquier URL genérica.
 */
export async function extractFromUrl(urlStr) {
    if (!urlStr) return null;

    try {
        const parsedUrl = new URL(urlStr.trim());
        const host = parsedUrl.hostname.toLowerCase().replace('www.', '');

        // ── Google Maps (including short URLs) ──────────────────────────────
        if (host.includes('google.com/maps') || host === 'goo.gl' || host === 'maps.app.goo.gl' || host.includes('maps.google')) {
            let fullUrl = urlStr;

            // Expand short URLs via redirect
            if (host === 'goo.gl' || host === 'maps.app.goo.gl') {
                try {
                    const r = await fetch(urlStr, { redirect: 'follow' });
                    fullUrl = r.url;
                } catch {
                    // keep original
                }
            }

            // Extract coordinates
            const coordMatch = fullUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            const lat = coordMatch ? parseFloat(coordMatch[1]) : null;
            const lng = coordMatch ? parseFloat(coordMatch[2]) : null;

            // Extract place name from URL path
            const placeMatch = fullUrl.match(/\/maps\/(?:place|search)\/([^/@?]+)/);
            const qParam = new URL(fullUrl.split('?').length > 1 ? fullUrl : fullUrl + '?').searchParams.get('q');
            const placeName = placeMatch
                ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
                : qParam || null;

            if (placeName) {
                const geo = await fetchLocationInfo(placeName);
                return {
                    name: placeName.split(',')[0].trim(),
                    address: geo?.address || null,
                    lat: lat ?? geo?.lat ?? null,
                    lng: lng ?? geo?.lng ?? null,
                    googleMapsUrl: lat ? `https://www.google.com/maps?q=${lat ?? geo?.lat},${lng ?? geo?.lng}` : geo?.googleMapsUrl || null,
                    appleMapsUrl: geo?.appleMapsUrl || (lat ? `https://maps.apple.com/?q=${encodeURIComponent(placeName)}&ll=${lat},${lng}` : null),
                    website: geo?.website || null,
                    description: null,
                };
            }

            if (lat && lng) {
                return {
                    name: null,
                    address: `${lat}, ${lng}`,
                    lat,
                    lng,
                    googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
                    appleMapsUrl: `https://maps.apple.com/?ll=${lat},${lng}`,
                    website: null,
                    description: null,
                };
            }
            return null;
        }

        // ── Apple Maps ──────────────────────────────────────────────────────
        if (host.includes('maps.apple.com')) {
            const q = parsedUrl.searchParams.get('q');
            if (q) {
                const geo = await fetchLocationInfo(q);
                return {
                    name: q.split(',')[0].trim(),
                    address: geo?.address || null,
                    lat: geo?.lat || null,
                    lng: geo?.lng || null,
                    googleMapsUrl: geo?.googleMapsUrl || null,
                    appleMapsUrl: urlStr,
                    website: geo?.website || null,
                    description: null,
                };
            }
            return null;
        }

        // ── TheFork / TripAdvisor / generic: fetch page metadata ──────────
        const response = await fetch(urlStr, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Gastronomos-Bot/1.0)',
                'Accept': 'text/html',
                'Accept-Language': 'es-ES,es;q=0.9',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(8000),
        });

        const html = await response.text();

        // Extract og:title / title
        const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
        const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
        const rawName = ogTitle || titleTag || null;

        if (!rawName) return null;

        // Clean name: remove site suffix
        const cleanName = rawName
            .replace(/\s*[-|–|·]\s*(thefork|tripadvisor|yelp|google|apple|opentable|restaurante|restaurantes)[^$]*/gi, '')
            .split(/[-|–]/)[0]
            .trim();

        if (cleanName.length < 2) return null;

        // og:description
        const ogDesc = html.match(/<meta[^>]+(?:property=["']og:description["']|name=["']description["'])[^>]+content=["']([^"']+)["']/i)?.[1];

        // Geocode
        const geo = await fetchLocationInfo(cleanName);

        return {
            name: cleanName,
            address: geo?.address || null,
            lat: geo?.lat || null,
            lng: geo?.lng || null,
            googleMapsUrl: geo?.googleMapsUrl || null,
            appleMapsUrl: geo?.appleMapsUrl || null,
            website: host.includes('thefork') || host.includes('tripadvisor')
                ? null
                : urlStr,
            description: ogDesc ? ogDesc.substring(0, 200) : null,
        };

    } catch (error) {
        console.error('extractFromUrl error:', error);
        return null;
    }
}

export async function fetchLocationInfo(query) {
    if (!query) return null;

    try {
        // Use OpenStreetMap Nominatim as geocoder
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&extratags=1`,
            { headers: { 'User-Agent': 'Gastronomos-Web-App' } }
        );

        const data = await response.json();
        if (!data || data.length === 0) return null;

        const place = data[0];
        const lat = parseFloat(place.lat);
        const lng = parseFloat(place.lon);

        // Build map URLs
        const coordsQuery = encodeURIComponent(`${lat},${lng}`);
        const nameQuery = encodeURIComponent(query);
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${nameQuery}&query_place_id=`;
        const googleMapsCoordsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const appleMapsUrl = `https://maps.apple.com/?q=${nameQuery}&ll=${lat},${lng}`;

        // Try to get website from extratags
        const website = place.extratags?.website || place.extratags?.url || null;

        return {
            address: place.display_name,
            lat,
            lng,
            googleMapsUrl: googleMapsCoordsUrl,
            appleMapsUrl,
            website,
        };
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
}
