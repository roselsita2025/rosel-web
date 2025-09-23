import express from 'express';
import { 
    geocode, 
    getDistance, 
    validateAddressController, 
    reverseGeocodeController,
    getDeliveryDistance 
} from '../controllers/maps.controller.js';

const router = express.Router();

/**
 * @route   POST /api/maps/geocode
 * @desc    Geocode an address to get coordinates
 * @access  Public
 * @body    { address: string }
 */
router.post('/geocode', geocode);

/**
 * @route   POST /api/maps/distance
 * @desc    Calculate distance between two points
 * @access  Public
 * @body    { origin: {lat: number, lng: number}, destination: {lat: number, lng: number} }
 */
router.post('/distance', getDistance);

/**
 * @route   POST /api/maps/validate-address
 * @desc    Validate an address and get suggestions
 * @access  Public
 * @body    { address: string }
 */
router.post('/validate-address', validateAddressController);

/**
 * @route   POST /api/maps/reverse-geocode
 * @desc    Reverse geocode coordinates to get address
 * @access  Public
 * @body    { lat: number, lng: number }
 */
router.post('/reverse-geocode', reverseGeocodeController);

/**
 * @route   POST /api/maps/delivery-distance
 * @desc    Get distance from pickup location to delivery address
 * @access  Public
 * @body    { deliveryAddress: string }
 */
router.post('/delivery-distance', getDeliveryDistance);

export default router;
