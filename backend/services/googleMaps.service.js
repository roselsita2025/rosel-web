import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

// Initialize Google Maps client with API key
const getGoogleMapsClient = () => {
    const apiKey = process.env.MAPS_PLATFORM_API_KEY;
    if (!apiKey) {
        throw new Error('MAPS_PLATFORM_API_KEY is not set in environment variables');
    }
    return client;
};

/**
 * Geocode an address to get coordinates
 * @param {string} address - Full address string
 * @returns {Promise<{lat: number, lng: number, formatted_address: string}>}
 */
export const geocodeAddress = async (address) => {
    try {
        const client = getGoogleMapsClient();
        
        const response = await client.geocode({
            params: {
                address: address,
                key: process.env.MAPS_PLATFORM_API_KEY,
                region: 'ph', // Restrict to Philippines
                language: 'en'
            }
        });

        if (response.data.results.length === 0) {
            throw new Error('Address not found');
        }

        const result = response.data.results[0];
        const location = result.geometry.location;

        return {
            lat: location.lat,
            lng: location.lng,
            formatted_address: result.formatted_address,
            place_id: result.place_id
        };
    } catch (error) {
        console.error('Geocoding error:', error.message);
        throw new Error(`Failed to geocode address: ${error.message}`);
    }
};

/**
 * Calculate distance between two points
 * @param {Object} origin - {lat: number, lng: number}
 * @param {Object} destination - {lat: number, lng: number}
 * @returns {Promise<{distance: number, duration: number}>}
 */
export const calculateDistance = async (origin, destination) => {
    try {
        const client = getGoogleMapsClient();
        
        const response = await client.distancematrix({
            params: {
                origins: [`${origin.lat},${origin.lng}`],
                destinations: [`${destination.lat},${destination.lng}`],
                key: process.env.MAPS_PLATFORM_API_KEY,
                units: 'metric',
                mode: 'driving',
                language: 'en'
            }
        });

        if (!response.data.rows[0] || !response.data.rows[0].elements[0]) {
            throw new Error('Unable to calculate distance');
        }

        const element = response.data.rows[0].elements[0];
        
        if (element.status !== 'OK') {
            throw new Error(`Distance calculation failed: ${element.status}`);
        }

        return {
            distance: element.distance.value / 1000, // Convert meters to kilometers
            duration: element.duration.value / 60, // Convert seconds to minutes
            distance_text: element.distance.text,
            duration_text: element.duration.text
        };
    } catch (error) {
        console.error('Distance calculation error:', error.message);
        throw new Error(`Failed to calculate distance: ${error.message}`);
    }
};

/**
 * Validate if an address exists and get suggestions
 * @param {string} address - Address to validate
 * @returns {Promise<{isValid: boolean, suggestions: Array, coordinates: Object}>}
 */
export const validateAddress = async (address) => {
    try {
        const client = getGoogleMapsClient();
        
        const response = await client.geocode({
            params: {
                address: address,
                key: process.env.MAPS_PLATFORM_API_KEY,
                region: 'ph',
                language: 'en'
            }
        });

        if (response.data.results.length === 0) {
            return {
                isValid: false,
                suggestions: [],
                coordinates: null
            };
        }

        const results = response.data.results;
        const primaryResult = results[0];
        const suggestions = results.slice(0, 5).map(result => ({
            formatted_address: result.formatted_address,
            place_id: result.place_id,
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
        }));

        return {
            isValid: true,
            suggestions: suggestions,
            coordinates: {
                lat: primaryResult.geometry.location.lat,
                lng: primaryResult.geometry.location.lng
            }
        };
    } catch (error) {
        console.error('Address validation error:', error.message);
        throw new Error(`Failed to validate address: ${error.message}`);
    }
};

/**
 * Get detailed address information from coordinates (reverse geocoding)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{address: string, components: Object}>}
 */
export const reverseGeocode = async (lat, lng) => {
    try {
        const client = getGoogleMapsClient();
        
        const response = await client.reverseGeocode({
            params: {
                latlng: { lat, lng },
                key: process.env.MAPS_PLATFORM_API_KEY,
                language: 'en',
                result_type: 'street_address|route|premise|subpremise'
            }
        });

        if (response.data.results.length === 0) {
            throw new Error('No address found for these coordinates');
        }

        const result = response.data.results[0];
        const components = {};
        
        // Extract address components
        result.address_components.forEach(component => {
            const types = component.types;
            if (types.includes('street_number')) components.street_number = component.long_name;
            if (types.includes('route')) components.route = component.long_name;
            if (types.includes('sublocality_level_1')) components.barangay = component.long_name;
            if (types.includes('locality')) components.city = component.long_name;
            if (types.includes('administrative_area_level_1')) components.province = component.long_name;
            if (types.includes('postal_code')) components.postal_code = component.long_name;
            if (types.includes('country')) components.country = component.long_name;
        });

        return {
            address: result.formatted_address,
            components: components,
            place_id: result.place_id
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error.message);
        throw new Error(`Failed to reverse geocode: ${error.message}`);
    }
};
