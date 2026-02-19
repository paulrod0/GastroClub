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
