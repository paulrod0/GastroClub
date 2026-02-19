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
    const url = formData.get('url');
    const address = formData.get('address');
    const description = formData.get('description');
    const cuisine = formData.get('cuisine') || null;
    const priceRange = parseInt(formData.get('priceRange')) || null;
    const lat = parseFloat(formData.get('lat')) || null;
    const lng = parseFloat(formData.get('lng')) || null;

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
        // We'll use OpenStreetMap's Nominatim API as a free geocoder
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: { 'User-Agent': 'Gastronomos-Web-App' }
        });

        const data = await response.json();
        if (data && data.length > 0) {
            return {
                address: data[0].display_name,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    return null;
}
