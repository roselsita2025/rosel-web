import lalamoveService from '../services/lalamove.service.js';
import { geocodeAddress, calculateDistance } from '../services/googleMaps.service.js';

/**
 * Get delivery quotation
 * POST /api/lalamove/quotation
 */
export const getQuotation = async (req, res) => {
    try {
        const { deliveryAddress, cartItems } = req.body;

        // Validate required fields
        if (!deliveryAddress || !cartItems || !Array.isArray(cartItems)) {
            return res.status(400).json({
                success: false,
                message: 'Delivery address and cart items are required'
            });
        }

        // Calculate total box quantity (each item represents 1 box)
        const totalBoxQuantity = cartItems.reduce((sum, item) => sum + (item.cartQuantity || item.quantity), 0);
        
        if (totalBoxQuantity === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Get pickup location
        const pickupLocation = lalamoveService.getPickupLocation();
        
        // Geocode delivery address
        const deliveryCoords = await geocodeAddress(deliveryAddress);
        
        // Calculate distance
        const distanceResult = await calculateDistance(
            { lat: pickupLocation.lat, lng: pickupLocation.lng },
            { lat: deliveryCoords.lat, lng: deliveryCoords.lng }
        );

        // Prepare stops for Lalamove
        const stops = [
            {
                coordinates: {
                    lat: pickupLocation.lat.toString(),
                    lng: pickupLocation.lng.toString()
                },
                address: pickupLocation.address
            },
            {
                coordinates: {
                    lat: deliveryCoords.lat.toString(),
                    lng: deliveryCoords.lng.toString()
                },
                address: deliveryCoords.formatted_address
            }
        ];

        // Get quotation from Lalamove
        const quotation = await lalamoveService.getQuotation({
            stops: stops,
            boxQuantity: totalBoxQuantity,
            distance: distanceResult.distance,
            language: 'en_PH'
        });

        res.status(200).json({
            success: true,
            data: {
                quotation: quotation.data,
                serviceType: quotation.serviceType,
                boxQuantity: quotation.boxQuantity,
                totalWeight: quotation.totalWeight,
                vehicleInfo: quotation.vehicleInfo,
                distance: distanceResult.distance,
                duration: distanceResult.duration,
                pickup: pickupLocation,
                delivery: {
                    lat: deliveryCoords.lat,
                    lng: deliveryCoords.lng,
                    address: deliveryCoords.formatted_address
                }
            },
            message: 'Quotation retrieved successfully'
        });

    } catch (error) {
        console.error('Get quotation controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get quotation'
        });
    }
};

/**
 * Place delivery order
 * POST /api/lalamove/order
 */
export const placeOrder = async (req, res) => {
    try {
        const {
            quotationId,
            senderName,
            senderPhone,
            recipientName,
            recipientPhone,
            recipientRemarks = '',
            stopId0,
            stopId1
        } = req.body;

        // Validate required fields
        if (!quotationId || !senderName || !senderPhone || !recipientName || !recipientPhone || !stopId0 || !stopId1) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Place order with Lalamove
        const order = await lalamoveService.placeOrder({
            quotationId,
            senderName,
            senderPhone,
            recipientName,
            recipientPhone,
            recipientRemarks,
            stopId0,
            stopId1
        });

        res.status(200).json({
            success: true,
            data: order.data,
            message: 'Order placed successfully'
        });

    } catch (error) {
        console.error('Place order controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to place order'
        });
    }
};

/**
 * Get order details
 * GET /api/lalamove/order/:orderId
 */
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const orderDetails = await lalamoveService.getOrderDetails(orderId);

        res.status(200).json({
            success: true,
            data: orderDetails.data,
            message: 'Order details retrieved successfully'
        });

    } catch (error) {
        console.error('Get order details controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get order details'
        });
    }
};

/**
 * Cancel order
 * DELETE /api/lalamove/order/:orderId
 */
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const cancellation = await lalamoveService.cancelOrder(orderId);

        res.status(200).json({
            success: true,
            data: cancellation.data,
            message: 'Order cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel order controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to cancel order'
        });
    }
};

/**
 * Set webhook URL
 * POST /api/lalamove/webhook
 */
export const setWebhook = async (req, res) => {
    try {
        const { webhookUrl } = req.body;

        if (!webhookUrl) {
            return res.status(400).json({
                success: false,
                message: 'Webhook URL is required'
            });
        }

        const webhookSetup = await lalamoveService.setWebhook(webhookUrl);

        res.status(200).json({
            success: true,
            data: webhookSetup.data,
            message: 'Webhook URL set successfully'
        });

    } catch (error) {
        console.error('Set webhook controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to set webhook URL'
        });
    }
};

/**
 * Get service configuration
 * GET /api/lalamove/config
 */
export const getConfig = async (req, res) => {
    try {
        const validation = lalamoveService.validateConfiguration();

        res.status(200).json({
            success: true,
            data: {
                isValid: validation.isValid,
                missing: validation.missing,
                config: validation.config
            },
            message: 'Configuration retrieved successfully'
        });

    } catch (error) {
        console.error('Get config controller error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get configuration'
        });
    }
};

/**
 * Test service type determination
 * POST /api/lalamove/test-service-type
 */
export const testServiceType = async (req, res) => {
    try {
        const { boxQuantity, distance } = req.body;

        if (typeof boxQuantity !== 'number' || typeof distance !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Box quantity and distance must be numbers'
            });
        }

        const vehicleInfo = lalamoveService.getVehicleInfo(boxQuantity, distance);
        const totalWeight = boxQuantity * 15; // 1 box = 15kg average

        res.status(200).json({
            success: true,
            data: {
                boxQuantity: boxQuantity,
                distance: distance,
                totalWeight: totalWeight,
                vehicleInfo: vehicleInfo,
                weightCategory: lalamoveService.getWeightCategory(totalWeight)
            },
            message: 'Vehicle type determined successfully'
        });

    } catch (error) {
        console.error('Test service type controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to determine vehicle type'
        });
    }
};

/**
 * Get all available vehicle types and their specifications
 * GET /api/lalamove/vehicle-types
 */
export const getVehicleTypes = async (req, res) => {
    try {
        const vehicleTypes = lalamoveService.getAllVehicleTypes();

        res.status(200).json({
            success: true,
            data: {
                vehicleTypes: vehicleTypes,
                totalTypes: Object.keys(vehicleTypes).length
            },
            message: 'Vehicle types retrieved successfully'
        });

    } catch (error) {
        console.error('Get vehicle types controller error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to get vehicle types'
        });
    }
};
