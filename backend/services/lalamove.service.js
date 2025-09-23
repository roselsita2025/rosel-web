import CryptoJS from 'crypto-js';
import axios from 'axios';

class LalamoveService {
    constructor() {
        this.apiKey = process.env.LALAMOVE_API_KEY;
        this.secret = process.env.LALAMOVE_API_SECRET;
        this.hostname = process.env.LALAMOVE_HOSTNAME;
        // Try different market codes for sandbox
        this.market = process.env.LALAMOVE_MARKET;
        console.log('Lalamove service initialized with market:', this.market);
        
        // Try PH_MNL for Philippines Manila
        if (this.market === 'PH') {
            this.market = 'PH_MNL';
            console.log('Updated market to:', this.market);
        }
        console.log('Using market:', this.market);
        this.locode = process.env.LALAMOVE_LOCODE;
        this.pickupLat = parseFloat(process.env.LALAMOVE_PICKUP_LAT);
        this.pickupLng = parseFloat(process.env.LALAMOVE_PICKUP_LNG);
        this.pickupAddress = process.env.LALAMOVE_PICKUP_ADDRESS;
        this.pickupPhone = process.env.LALAMOVE_PICK_PHONE;
        this.itemCategory = process.env.LALAMOVE_ITEM_CATEGORY;
        
        // Use sandbox-specific hostname if in sandbox mode
        this.baseURL = this.hostname.includes('sandbox') ? `https://${this.hostname}` : `https://sandbox-rest.lalamove.com`;
    }

    /**
     * Generate HMAC SHA256 signature for Lalamove API
     * @param {string} timestamp - Unix timestamp
     * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
     * @param {string} path - API path
     * @param {string} body - Request body (empty string for GET/DELETE)
     * @returns {string} HMAC signature
     */
    generateSignature(timestamp, method, path, body = '') {
        const message = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${body}`;
        return CryptoJS.HmacSHA256(message, this.secret).toString();
    }

    /**
     * Get authorization header for Lalamove API
     * @param {string} timestamp - Unix timestamp
     * @param {string} method - HTTP method
     * @param {string} path - API path
     * @param {string} body - Request body
     * @returns {string} Authorization header value
     */
    getAuthHeader(timestamp, method, path, body = '') {
        const signature = this.generateSignature(timestamp, method, path, body);
        return `hmac ${this.apiKey}:${timestamp}:${signature}`;
    }

    /**
     * Vehicle specifications with box capacity and dimensions
     */
    getVehicleSpecs() {
        return {
            SEDAN: { boxes: 6, load: 200, dimensions: "1.0 × 0.6 × 0.7", distance: null },
            SEDAN_INTERCITY: { boxes: 6, load: 200, dimensions: "1.0 × 0.6 × 0.7", distance: 40 },
            MPV: { boxes: 16, load: 300, dimensions: "1.2 × 1.0 × 0.9", distance: null },
            MPV_INTERCITY: { boxes: 16, load: 300, dimensions: "1.2 × 1.0 × 0.9", distance: 40 },
            VAN: { boxes: 40, load: 600, dimensions: "2.1 × 1.2 × 1.1", distance: null },
            VAN_INTERCITY: { boxes: 40, load: 600, dimensions: "2.1 × 1.2 × 1.1", distance: 40 },
            VAN1000: { boxes: 47, load: 1000, dimensions: "2.1 × 1.2 × 1.2", distance: null },
            TRUCK550: { boxes: 122, load: 2000, dimensions: "2.7 × 1.7 × 1.7", distance: null },
            "10WHEEL_TRUCK": { boxes: 800, load: 12000, dimensions: "10 × 2.4 × 2.3", distance: null },
            LD_10WHEEL_TRUCK: { boxes: 800, load: 12000, dimensions: "10 × 2.4 × 2.3", distance: 40 }
        };
    }

    /**
     * Determine service type based on box quantity and distance
     * @param {number} boxQuantity - Total number of boxes (quantity)
     * @param {number} distance - Distance in kilometers
     * @returns {string} Service type
     */
    determineServiceType(boxQuantity, distance) {
        const vehicleSpecs = this.getVehicleSpecs();
        
        // Check for intercity vehicles first (distance > 40km)
        if (distance > 40) {
            if (boxQuantity <= vehicleSpecs.SEDAN_INTERCITY.boxes) {
                return "SEDAN_INTERCITY";
            } else if (boxQuantity <= vehicleSpecs.MPV_INTERCITY.boxes) {
                return "MPV_INTERCITY";
            } else if (boxQuantity <= vehicleSpecs.VAN_INTERCITY.boxes) {
                return "VAN_INTERCITY";
            } else if (boxQuantity <= vehicleSpecs.LD_10WHEEL_TRUCK.boxes) {
                return "LD_10WHEEL_TRUCK";
            } else {
                return "SPLIT_DELIVERY_REQUIRED";
            }
        } else {
            // Regular vehicles for local delivery
            if (boxQuantity <= vehicleSpecs.SEDAN.boxes) {
                return "SEDAN";
            } else if (boxQuantity <= vehicleSpecs.MPV.boxes) {
                return "MPV";
            } else if (boxQuantity <= vehicleSpecs.VAN.boxes) {
                return "VAN";
            } else if (boxQuantity <= vehicleSpecs.VAN1000.boxes) {
                return "VAN1000";
            } else if (boxQuantity <= vehicleSpecs.TRUCK550.boxes) {
                return "TRUCK550";
            } else if (boxQuantity <= vehicleSpecs["10WHEEL_TRUCK"].boxes) {
                return "10WHEEL_TRUCK";
            } else {
                return "SPLIT_DELIVERY_REQUIRED";
            }
        }
    }

    /**
     * Get quotation for delivery
     * @param {Object} params - Quotation parameters
     * @param {Array} params.stops - Array of stops with coordinates and addresses
     * @param {number} params.boxQuantity - Total number of boxes (quantity)
     * @param {number} params.distance - Distance in kilometers
     * @param {string} params.language - Language code (default: en_PH)
     * @returns {Promise<Object>} Quotation response
     */
    async getQuotation(params) {
        try {
            const { stops, boxQuantity, distance, language = 'en_PH' } = params;
            
            const serviceType = this.determineServiceType(boxQuantity, distance);
            const vehicleSpecs = this.getVehicleSpecs();
            const selectedVehicle = vehicleSpecs[serviceType];
            
            // Calculate total weight based on box quantity (assuming average weight per box)
            const totalWeight = boxQuantity * 15; // 1 box = 15kg average
            
            const requestBody = {
                data: {
                    serviceType: serviceType,
                    language: language,
                    stops: stops,
                    isRouteOptimized: false,
                    item: {
                        quantity: boxQuantity.toString(),
                        weight: this.getWeightCategory(totalWeight),
                        categories: [this.itemCategory],
                        handlingInstructions: ["HANDLE_WITH_CARE"]
                    }
                }
            };

            const timestamp = Date.now().toString();
            const path = '/v3/quotations';
            const body = JSON.stringify(requestBody);
            const authHeader = this.getAuthHeader(timestamp, 'POST', path, body);

            const response = await axios.post(`${this.baseURL}${path}`, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'Market': this.market
                }
            });

            return {
                success: true,
                data: response.data,
                serviceType: serviceType,
                boxQuantity: boxQuantity,
                totalWeight: totalWeight,
                vehicleInfo: {
                    type: serviceType,
                    maxBoxes: selectedVehicle.boxes,
                    maxLoad: selectedVehicle.load,
                    dimensions: selectedVehicle.dimensions,
                    isIntercity: selectedVehicle.distance !== null,
                    fixedDistance: selectedVehicle.distance
                }
            };
        } catch (error) {
            console.error('Lalamove quotation error:', error.response?.data || error.message);
            throw new Error(`Failed to get quotation: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Place order using quotation
     * @param {Object} params - Order parameters
     * @param {string} params.quotationId - Quotation ID from getQuotation
     * @param {string} params.senderName - Sender name
     * @param {string} params.senderPhone - Sender phone
     * @param {string} params.recipientName - Recipient name
     * @param {string} params.recipientPhone - Recipient phone
     * @param {string} params.recipientRemarks - Optional remarks
     * @param {string} params.stopId0 - Pickup stop ID
     * @param {string} params.stopId1 - Delivery stop ID
     * @returns {Promise<Object>} Order response
     */
    async placeOrder(params) {
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
            } = params;

            const requestBody = {
                data: {
                    quotationId: quotationId,
                    sender: {
                        stopId: stopId0,
                        name: senderName,
                        phone: senderPhone
                    },
                    recipients: [
                        {
                            stopId: stopId1,
                            name: recipientName,
                            phone: recipientPhone,
                            remarks: recipientRemarks
                        }
                    ],
                    isPODEnabled: true,
                    partner: "Rosel Web Store"
                }
            };

            const timestamp = Date.now().toString();
            const path = '/v3/orders';
            const body = JSON.stringify(requestBody);
            const authHeader = this.getAuthHeader(timestamp, 'POST', path, body);

            // Market header is required even in sandbox mode
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                'Market': this.market
            };

            console.log('Lalamove Place Order API Request:', {
                url: `${this.baseURL}${path}`,
                method: 'POST',
                headers: headers,
                body: requestBody
            });

            const response = await axios.post(`${this.baseURL}${path}`, requestBody, {
                headers: headers
            });

            console.log('Lalamove Place Order Response:', response.data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lalamove place order error:', error.response?.data || error.message);
            console.error('Full error response:', error.response);
            throw new Error(`Failed to place order: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get order details
     * @param {string} orderId - Order ID
     * @returns {Promise<Object>} Order details
     */
    async getOrderDetails(orderId) {
        try {
            const timestamp = Date.now().toString();
            const path = `/v3/orders/${orderId}`;
            const authHeader = this.getAuthHeader(timestamp, 'GET', path);

            const response = await axios.get(`${this.baseURL}${path}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'Market': this.market
                }
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lalamove get order details error:', error.response?.data || error.message);
            throw new Error(`Failed to get order details: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Cancel order
     * @param {string} orderId - Order ID
     * @returns {Promise<Object>} Cancellation response
     */
    async cancelOrder(orderId) {
        try {
            const timestamp = Date.now().toString();
            const path = `/v3/orders/${orderId}`;
            const authHeader = this.getAuthHeader(timestamp, 'DELETE', path);

            const response = await axios.delete(`${this.baseURL}${path}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'Market': this.market
                }
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lalamove cancel order error:', error.response?.data || error.message);
            throw new Error(`Failed to cancel order: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Set webhook URL
     * @param {string} webhookUrl - Webhook URL
     * @returns {Promise<Object>} Webhook setup response
     */
    async setWebhook(webhookUrl) {
        try {
            const requestBody = {
                data: {
                    url: webhookUrl
                }
            };

            const timestamp = Date.now().toString();
            const path = '/v3/webhook';
            const body = JSON.stringify(requestBody);
            const authHeader = this.getAuthHeader(timestamp, 'PATCH', path, body);

            const response = await axios.patch(`${this.baseURL}${path}`, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                    'Market': this.market
                }
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Lalamove set webhook error:', error.response?.data || error.message);
            throw new Error(`Failed to set webhook: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get weight category for Lalamove API
     * @param {number} weight - Weight in kg
     * @returns {string} Weight category
     */
    getWeightCategory(weight) {
        if (weight < 3) return "LESS_THAN_3_KG";
        if (weight < 10) return "3_TO_10_KG";
        if (weight < 50) return "10_TO_50_KG";
        return "MORE_THAN_50_KG";
    }

    /**
     * Get pickup location details
     * @returns {Object} Pickup location
     */
    getPickupLocation() {
        return {
            lat: this.pickupLat,
            lng: this.pickupLng,
            address: this.pickupAddress,
            phone: this.pickupPhone
        };
    }

    /**
     * Get vehicle information for a given box quantity and distance
     * @param {number} boxQuantity - Number of boxes
     * @param {number} distance - Distance in kilometers
     * @returns {Object} Vehicle information
     */
    getVehicleInfo(boxQuantity, distance) {
        const serviceType = this.determineServiceType(boxQuantity, distance);
        const vehicleSpecs = this.getVehicleSpecs();
        const selectedVehicle = vehicleSpecs[serviceType];
        
        return {
            serviceType: serviceType,
            maxBoxes: selectedVehicle.boxes,
            maxLoad: selectedVehicle.load,
            dimensions: selectedVehicle.dimensions,
            isIntercity: selectedVehicle.distance !== null,
            fixedDistance: selectedVehicle.distance,
            canAccommodate: boxQuantity <= selectedVehicle.boxes,
            utilizationPercentage: Math.round((boxQuantity / selectedVehicle.boxes) * 100)
        };
    }

    /**
     * Get all available vehicle types with their specifications
     * @returns {Object} All vehicle specifications
     */
    getAllVehicleTypes() {
        return this.getVehicleSpecs();
    }

    /**
     * Validate service configuration
     * @returns {Object} Validation result
     */
    validateConfiguration() {
        const required = [
            'apiKey', 'secret', 'hostname', 'market', 'locode',
            'pickupLat', 'pickupLng', 'pickupAddress', 'pickupPhone', 'itemCategory'
        ];

        const missing = required.filter(key => !this[key]);
        
        return {
            isValid: missing.length === 0,
            missing: missing,
            config: {
                market: this.market,
                locode: this.locode,
                pickupLocation: this.getPickupLocation(),
                itemCategory: this.itemCategory
            }
        };
    }
}

// Create singleton instance
const lalamoveService = new LalamoveService();

export default lalamoveService;
