/**
 * Fetches the CDN photo URL for a Google Places photo resource name.
 * Resource name format: "places/ChIJ.../photos/AeXXXX"
 * Returns a direct https://lh3.googleusercontent.com/... URL, or null on failure.
 */
export async function fetchPlacePhotoUrl(photoResourceName, apiKey) {
    try {
        const res = await fetch(
            `https://places.googleapis.com/v1/${photoResourceName}/media?maxWidthPx=800&key=${apiKey}&skipHttpRedirect=true`,
            { next: { revalidate: 86400 } } // cache 24h — CDN URLs are content-addressed
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.photoUri || null;
    } catch {
        return null;
    }
}
