'use server';

import { prisma } from '@/lib/prisma';
import { GOOGLE_CUISINE_MAP } from '@/lib/cuisineMap';
import { fetchPlacePhotoUrl } from '@/lib/placesPhoto';

// ── Keyword maps ─────────────────────────────────────────────────────────────

const CUISINE_KEYWORDS = {
    // Japonesa
    'japonés': 'Japonesa', 'japonesa': 'Japonesa', 'japones': 'Japonesa',
    'sushi': 'Japonesa', 'ramen': 'Japonesa', 'sashimi': 'Japonesa', 'tempura': 'Japonesa',
    // Italiana
    'italiana': 'Italiana', 'italiano': 'Italiana',
    'pizza': 'Italiana', 'pasta': 'Italiana', 'risotto': 'Italiana',
    // Mexicana
    'mexicana': 'Mexicana', 'mexicano': 'Mexicana',
    'tacos': 'Mexicana', 'burrito': 'Mexicana', 'guacamole': 'Mexicana',
    // Española
    'española': 'Española', 'español': 'Española', 'espanola': 'Española',
    'cocido': 'Española', 'paella': 'Española', 'gazpacho': 'Española',
    // Tapas
    'tapas': 'Tapas', 'pinchos': 'Tapas', 'pintxos': 'Tapas',
    'vermut': 'Tapas', 'vermú': 'Tapas',
    // China
    'china': 'China', 'chino': 'China', 'dimsum': 'China', 'dim sum': 'China',
    // Francesa
    'francesa': 'Francesa', 'francés': 'Francesa', 'frances': 'Francesa',
    'brasserie': 'Francesa', 'bistrot': 'Francesa',
    // India
    'india': 'India', 'indio': 'India', 'curry': 'India', 'naan': 'India',
    // Tailandesa
    'tailandesa': 'Tailandesa', 'tailandés': 'Tailandesa', 'thai': 'Tailandesa',
    // Mediterránea
    'mediterránea': 'Mediterránea', 'mediterranea': 'Mediterránea',
    // Americana
    'americana': 'Americana', 'americano': 'Americana',
    'hamburguesa': 'Americana', 'burger': 'Americana', 'barbacoa': 'Americana',
    // Peruana
    'peruana': 'Peruana', 'peruano': 'Peruana', 'cebiche': 'Peruana', 'ceviche': 'Peruana',
    // Árabe
    'árabe': 'Árabe', 'arabe': 'Árabe', 'libanesa': 'Árabe',
    'falafel': 'Árabe', 'hummus': 'Árabe', 'kebab': 'Árabe',
    // Griega
    'griega': 'Griega', 'griego': 'Griega', 'gyros': 'Griega',
    // Coreana
    'coreana': 'Coreana', 'coreano': 'Coreana',
    // Vietnamita
    'vietnamita': 'Vietnamita', 'pho': 'Vietnamita',
    // Marisquería
    'marisquería': 'Marisquería', 'marisco': 'Marisquería', 'mariscos': 'Marisquería',
    'pescado': 'Marisquería', 'pescadería': 'Marisquería',
    'ostras': 'Marisquería', 'mejillones': 'Marisquería',
    // Asador
    'asador': 'Asador', 'carne': 'Asador', 'parrilla': 'Asador',
    'brasa': 'Asador', 'churrasco': 'Asador',
    // Vegetariana
    'vegetariana': 'Vegetariana', 'vegetariano': 'Vegetariana',
    'vegano': 'Vegetariana', 'vegana': 'Vegetariana', 'vegan': 'Vegetariana',
    // Fusión
    'fusión': 'Fusión', 'fusion': 'Fusión', 'moderno': 'Fusión',
};

const KNOWN_CITIES = [
    'madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'málaga', 'malaga',
    'granada', 'zaragoza', 'murcia', 'palma', 'alicante', 'córdoba', 'cordoba',
    'valladolid', 'vigo', 'gijón', 'gijon', 'vitoria', 'coruña', 'donostia',
    'san sebastián', 'san sebastian', 'pamplona', 'toledo', 'burgos', 'salamanca',
    'logroño', 'logronyo', 'santander', 'oviedo', 'badajoz', 'albacete',
    'tarragona', 'lleida', 'girona', 'castellón', 'castellon',
];

const FEATURE_KEYWORDS = [
    'sin gluten', 'gluten', 'celíaco', 'celiaco',
    'terraza', 'vistas', 'rooftop', 'azotea',
    'romántico', 'romantico', 'romántica',
    'familiar', 'niños', 'niñas',
    'grupos', 'grupo',
    'barato', 'económico', 'economico', 'precio bajo',
    'de moda', 'trendy', 'moderno', 'moderna',
    'íntimo', 'intimo',
    'brunch', 'desayuno', 'almuerzo', 'cena',
    'coctel', 'cóctel', 'cocktail',
    'reservar', 'reservas',
];

// ── Keyword extractor ─────────────────────────────────────────────────────────

function extractKeywords(query) {
    const lower = query.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // strip accents for matching
    const original = query.toLowerCase();

    // Extract cuisines
    const cuisines = [];
    for (const [kw, label] of Object.entries(CUISINE_KEYWORDS)) {
        const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if ((lower.includes(kwNorm) || original.includes(kw)) && !cuisines.includes(label)) {
            cuisines.push(label);
        }
    }

    // Extract city
    let city = null;
    for (const c of KNOWN_CITIES) {
        const cNorm = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (lower.includes(cNorm) || original.includes(c)) {
            city = c;
            break;
        }
    }

    // Extract feature phrases
    const features = [];
    for (const feat of FEATURE_KEYWORDS) {
        const featNorm = feat.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (lower.includes(featNorm) || original.includes(feat)) {
            features.push(feat);
        }
    }

    // Raw words: exclude cities, stopwords, cuisine/feature words already extracted
    const allCuisineKeywords = Object.keys(CUISINE_KEYWORDS).map(k =>
        k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
    const stopwords = ['para', 'con', 'que', 'una', 'unos', 'unas', 'los', 'las', 'del', 'por', 'sin', 'muy'];

    const rawWords = lower
        .split(/\s+/)
        .filter(w =>
            w.length > 3 &&
            !KNOWN_CITIES.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === w) &&
            !allCuisineKeywords.includes(w) &&
            !stopwords.includes(w)
        );

    return { cuisines, city, features, rawWords };
}

// ── DB search ─────────────────────────────────────────────────────────────────

async function searchDB(keywords) {
    const { cuisines, city, features, rawWords } = keywords;

    // Build OR conditions from cuisine + features + raw words
    // City acts as AND filter (not OR), so it's applied separately
    const orConditions = [];

    // Exact cuisine match
    for (const c of cuisines) {
        orConditions.push({ cuisine: { equals: c, mode: 'insensitive' } });
    }

    // Features in name or description
    for (const feat of features) {
        orConditions.push({ name: { contains: feat, mode: 'insensitive' } });
        orConditions.push({ description: { contains: feat, mode: 'insensitive' } });
    }

    // Raw words only in name and description (not address, to avoid city leakage)
    for (const word of rawWords) {
        orConditions.push({ name: { contains: word, mode: 'insensitive' } });
        orConditions.push({ description: { contains: word, mode: 'insensitive' } });
    }

    // If no specific criteria (only city was given), return empty
    if (orConditions.length === 0) return [];

    // City is an AND filter on top of the OR conditions
    const whereClause = city
        ? { AND: [{ address: { contains: city, mode: 'insensitive' } }, { OR: orConditions }] }
        : { OR: orConditions };

    if (Object.keys(whereClause).length === 0) return [];

    try {
        return await prisma.restaurant.findMany({
            where: whereClause,
            include: { addedBy: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 6,
        });
    } catch (err) {
        console.error('chatSearch DB error:', err);
        return [];
    }
}

// ── External Google Places search ─────────────────────────────────────────────

const PRICE_LEVEL_MAP = {
    'PRICE_LEVEL_FREE': 1,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4,
};

async function searchExternal(query) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return [];

    try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.types,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.websiteUri,places.photos',
            },
            body: JSON.stringify({
                textQuery: query,
                maxResultCount: 5,
                languageCode: 'es',
            }),
            next: { revalidate: 0 },
        });

        const data = await res.json();
        if (!data.places) return [];

        return await Promise.all(
            data.places.map(async (place) => {
                // Cuisine from types
                let cuisineLabel = null;
                for (const t of (place.types || [])) {
                    if (GOOGLE_CUISINE_MAP[t]) { cuisineLabel = GOOGLE_CUISINE_MAP[t]; break; }
                }

                // Photo
                let photoUrl = null;
                const firstPhoto = place.photos?.[0];
                if (firstPhoto?.name) {
                    photoUrl = await fetchPlacePhotoUrl(firstPhoto.name, apiKey);
                }

                return {
                    name: place.displayName?.text || '',
                    address: place.formattedAddress || null,
                    cuisineLabel,
                    priceLevel: PRICE_LEVEL_MAP[place.priceLevel] || null,
                    rating: place.rating || null,
                    ratingCount: place.userRatingCount || null,
                    googleMapsUrl: place.googleMapsUri || null,
                    website: place.websiteUri || null,
                    photoUrl,
                    source: 'google',
                };
            })
        );
    } catch (err) {
        console.error('chatSearch external error:', err);
        return [];
    }
}

// ── Main exported action ──────────────────────────────────────────────────────

export async function chatSearch(query) {
    if (!query || query.trim().length < 2) {
        return { group: [], external: [] };
    }

    const keywords = extractKeywords(query.trim());

    // Run DB and external search in parallel
    const [group, external] = await Promise.all([
        searchDB(keywords),
        searchExternal(query.trim()),
    ]);

    return { group, external };
}
