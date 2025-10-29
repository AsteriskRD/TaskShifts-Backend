import NodeGeocoder from 'node-geocoder';
import PostalCache from '../models/PostalCache';

const openCage = NodeGeocoder({
  provider: 'opencage',
  apiKey: process.env.OPENCAGE_API_KEY
});

const google = NodeGeocoder({
  provider: 'google',
  apiKey: process.env.GOOGLE_MAPS_API_KEY
});

/**
 * Get lat/lon for a postal code (global).
 * 1 Check cache in MongoDB
 * 2 Try OpenCage API
 * 3 Fallback to Google Maps API if no result
 * 4 Save to cache
 */
export async function getCoordinates(postalCode: string, country: string = 'CA') {
  const normalized = postalCode.replace(/\s+/g, '').toUpperCase();

  // Check MongoDB cache
  const cached = await PostalCache.findOne({ country, postalCode: normalized });
  if (cached) {
    return {
      latitude: cached.latitude,
      longitude: cached.longitude,
      provider: cached.provider,
      fromCache: true
    };
  }

  // Try OpenCage
  try {
    const res = await openCage.geocode({ countryCode: country, zipcode: postalCode });
    if (res.length > 0 && res[0].latitude && res[0].longitude) {
      const confidence = res[0].extra?.confidence || 0;

      // If confidence is high enough, accept it
      if (confidence >= 5) {
        const coords = {
          latitude: res[0].latitude,
          longitude: res[0].longitude
        };
        await PostalCache.create({ ...coords, country, postalCode: normalized, provider: 'opencage' });
        return { ...coords, provider: 'opencage', fromCache: false, confidence };
      }
    }
  } catch (err) {
    console.error('OpenCage error:', err);
  }

  // Fallback to Google Maps
  console.warn(`Low confidence (${confidence}), using Google fallback...`);
  try {
    const res = await google.geocode({ countryCode: country, zipcode: postalCode });
    if (res.length > 0 && res[0].latitude && res[0].longitude) {
      const coords = {
        latitude: res[0].latitude,
        longitude: res[0].longitude
      };
      await PostalCache.create({ ...coords, country, postalCode: normalized, provider: 'google' });
      return { ...coords, provider: 'google', fromCache: false };
    }
  } catch (err) {
    console.error('Google Geocode error:', err);
  }

  return null;
}
