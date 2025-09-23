import { geocodeAddress, calculateDistance, validateAddress, reverseGeocode } from '../services/googleMaps.service.js';

/**
 * Geocode an address to get coordinates
 * POST /api/maps/geocode
 */
export const geocode = async (req, res) => {
    try {
        const { address } = req.body;

        if (!address || typeof address !== 'string' || address.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Address is required and must be a non-empty string'
            });
        }

        const result = await geocodeAddress(address.trim());
        
        res.status(200).json({
            success: true,
            data: result,
            message: 'Address geocoded successfully'
        });
    } catch (error) {
        console.error('Geocode controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to geocode address'
        });
    }
};

/**
 * Calculate distance between two points
 * POST /api/maps/distance
 */
export const getDistance = async (req, res) => {
    try {
        const { origin, destination } = req.body;

        // Validate origin
        if (!origin || typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Origin must be an object with lat and lng numbers'
            });
        }

        // Validate destination
        if (!destination || typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Destination must be an object with lat and lng numbers'
            });
        }

        const result = await calculateDistance(origin, destination);
        
        res.status(200).json({
            success: true,
            data: result,
            message: 'Distance calculated successfully'
        });
    } catch (error) {
        console.error('Distance controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to calculate distance'
        });
    }
};

/**
 * Validate an address and get suggestions
 * POST /api/maps/validate-address
 */
export const validateAddressController = async (req, res) => {
    try {
        const { address } = req.body;

        if (!address || typeof address !== 'string' || address.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Address is required and must be a non-empty string'
            });
        }

        const result = await validateAddress(address.trim());
        
        res.status(200).json({
            success: true,
            data: result,
            message: result.isValid ? 'Address is valid' : 'Address not found, suggestions provided'
        });
    } catch (error) {
        console.error('Validate address controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to validate address'
        });
    }
};

/**
 * Reverse geocode coordinates to get address
 * POST /api/maps/reverse-geocode
 */
export const reverseGeocodeController = async (req, res) => {
    try {
        const { lat, lng } = req.body;

        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude must be numbers'
            });
        }

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinate values'
            });
        }

        const result = await reverseGeocode(lat, lng);
        
        res.status(200).json({
            success: true,
            data: result,
            message: 'Coordinates reverse geocoded successfully'
        });
    } catch (error) {
        console.error('Reverse geocode controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to reverse geocode coordinates'
        });
    }
};

/**
 * Get distance from pickup location to delivery address
 * POST /api/maps/delivery-distance
 */
export const getDeliveryDistance = async (req, res) => {
    try {
        const { deliveryAddress } = req.body;

        if (!deliveryAddress || typeof deliveryAddress !== 'string' || deliveryAddress.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Delivery address is required'
            });
        }

        // Get pickup coordinates from environment variables
        const pickupLat = parseFloat(process.env.LALAMOVE_PICKUP_LAT);
        const pickupLng = parseFloat(process.env.LALAMOVE_PICKUP_LNG);

        if (!pickupLat || !pickupLng) {
            return res.status(500).json({
                success: false,
                message: 'Pickup location not configured'
            });
        }

        // Geocode the delivery address
        const deliveryCoords = await geocodeAddress(deliveryAddress.trim());
        
        // Calculate distance
        const distanceResult = await calculateDistance(
            { lat: pickupLat, lng: pickupLng },
            { lat: deliveryCoords.lat, lng: deliveryCoords.lng }
        );

        res.status(200).json({
            success: true,
            data: {
                pickup: {
                    lat: pickupLat,
                    lng: pickupLng,
                    address: process.env.LALAMOVE_PICKUP_ADDRESS
                },
                delivery: {
                    lat: deliveryCoords.lat,
                    lng: deliveryCoords.lng,
                    address: deliveryCoords.formatted_address
                },
                distance: distanceResult.distance,
                duration: distanceResult.duration,
                distance_text: distanceResult.distance_text,
                duration_text: distanceResult.duration_text,
                isIntercity: distanceResult.distance > 40
            },
            message: 'Delivery distance calculated successfully'
        });
    } catch (error) {
        console.error('Delivery distance controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to calculate delivery distance'
        });
    }
};
