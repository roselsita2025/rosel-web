import mongoose from 'mongoose';
import ReplacementRequest from '../models/replacementRequest.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { sendEmail } from '../sendgrid/emails.js';
import { REPLACEMENT_REQUEST_SUBMITTED_TEMPLATE, REPLACEMENT_REQUEST_STATUS_UPDATE_TEMPLATE } from '../sendgrid/emailTemplates.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Create a new replacement request
 * POST /api/replacement-requests
 */
export const createReplacementRequest = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            orderId,
            productId,
            quantity,
            reason,
            description,
            contactNumber,
            images = []
        } = req.body;

        // Validate required fields
        if (!orderId || !productId || !quantity || !reason || !description || !contactNumber || !images || images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: orderId, productId, quantity, reason, description, contactNumber, images'
            });
        }

        // Verify the order belongs to the user
        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('products.product', 'name image price');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or access denied'
            });
        }

        // Verify the product exists in the order
        const orderProduct = order.products.find(
            item => item.product._id.toString() === productId
        );

        if (!orderProduct) {
            return res.status(400).json({
                success: false,
                message: 'Product not found in the specified order'
            });
        }

        // Check if quantity is valid
        if (quantity > orderProduct.quantity) {
            return res.status(400).json({
                success: false,
                message: 'Requested quantity cannot exceed the ordered quantity'
            });
        }

        // Check if there's already a pending request for this product in this order
        const existingRequest = await ReplacementRequest.findOne({
            user: userId,
            order: orderId,
            product: productId,
            status: { $in: ['pending', 'under_review', 'approved', 'processing'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'A replacement request for this product is already pending or in progress'
            });
        }

        // Verify the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Create the replacement request
        const replacementRequest = new ReplacementRequest({
            user: userId,
            order: orderId,
            product: productId,
            quantity,
            reason,
            description,
            contactNumber,
            images
        });

        await replacementRequest.save();

        // Populate the request with related data
        await replacementRequest.populate([
            { path: 'user', select: 'name email' },
            { path: 'order', select: '_id totalAmount createdAt' },
            { path: 'product', select: 'name image price category' }
        ]);

        // Send notification to admins about new replacement request
        try {
            await notificationService.sendNewReplacementRequestNotification(replacementRequest);
        } catch (notificationError) {
            console.error('Error sending new replacement request notification:', notificationError);
            // Don't fail the request creation if notification fails
        }

        // Send email notification to admin
        try {
            const adminUsers = await User.find({ role: 'admin' });
            const adminEmails = adminUsers.map(admin => admin.email);

            if (adminEmails.length > 0) {
                const emailData = {
                    customerName: replacementRequest.user.name,
                    customerEmail: replacementRequest.user.email,
                    orderNumber: order._id.toString().slice(-8).toUpperCase(),
                    productName: replacementRequest.product.name,
                    quantity: replacementRequest.quantity,
                    reason: replacementRequest.reason,
                    description: replacementRequest.description,
                    requestNumber: replacementRequest.requestNumber,
                    priority: replacementRequest.priority,
                    requestDate: replacementRequest.createdAt.toLocaleDateString()
                };

                await sendEmail(
                    adminEmails,
                    'New Replacement Request Submitted',
                    REPLACEMENT_REQUEST_SUBMITTED_TEMPLATE,
                    emailData
                );
            }
        } catch (emailError) {
            console.error('Error sending admin notification email:', emailError);
            // Don't fail the request creation if email fails
        }

        res.status(201).json({
            success: true,
            data: replacementRequest,
            message: 'Replacement request submitted successfully'
        });

    } catch (error) {
        console.error('Create replacement request error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create replacement request',
            error: error.message
        });
    }
};

/**
 * Get replacement requests for the authenticated customer
 * GET /api/replacement-requests
 */
export const getCustomerReplacementRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Build query filter
        const filter = { user: userId };
        if (status) {
            filter.status = status;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get replacement requests with populated data
        const requests = await ReplacementRequest.find(filter)
            .populate('order', '_id totalAmount createdAt')
            .populate('product', 'name image price category')
            .populate('replacementProduct', 'name image price category')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalRequests = await ReplacementRequest.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                requests,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRequests / parseInt(limit)),
                    totalRequests,
                    hasNextPage: skip + requests.length < totalRequests,
                    hasPrevPage: parseInt(page) > 1
                }
            },
            message: 'Replacement requests retrieved successfully'
        });

    } catch (error) {
        console.error('Get customer replacement requests error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve replacement requests',
            error: error.message
        });
    }
};

/**
 * Get specific replacement request details for customer
 * GET /api/replacement-requests/:requestId
 */
export const getReplacementRequestDetails = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request ID format'
            });
        }

        // Find request and verify ownership
        const request = await ReplacementRequest.findOne({ _id: requestId, user: userId })
            .populate('order', '_id totalAmount createdAt shippingInfo')
            .populate('product', 'name image price category description')
            .populate('replacementProduct', 'name image price category description')
            .populate('handledBy', 'name email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Replacement request not found or access denied'
            });
        }

        res.status(200).json({
            success: true,
            data: request,
            message: 'Replacement request details retrieved successfully'
        });

    } catch (error) {
        console.error('Get replacement request details error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve replacement request details',
            error: error.message
        });
    }
};

/**
 * Get all replacement requests for admin
 * GET /api/admin/replacement-requests
 */
export const getAllReplacementRequests = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            priority,
            search, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;

        // Build query filter
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (priority) {
            filter.priority = priority;
        }

        // Search functionality
        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { adminResponse: { $regex: search, $options: 'i' } },
                { trackingNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get replacement requests with populated data
        const requests = await ReplacementRequest.find(filter)
            .populate('user', 'name email phone')
            .populate('order', '_id totalAmount createdAt')
            .populate('product', 'name image price category')
            .populate('replacementProduct', 'name image price category')
            .populate('handledBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalRequests = await ReplacementRequest.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                requests,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRequests / parseInt(limit)),
                    totalRequests,
                    hasNextPage: skip + requests.length < totalRequests,
                    hasPrevPage: parseInt(page) > 1
                }
            },
            message: 'Replacement requests retrieved successfully'
        });

    } catch (error) {
        console.error('Get all replacement requests error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve replacement requests',
            error: error.message
        });
    }
};

/**
 * Update replacement request status (Admin only)
 * PATCH /api/admin/replacement-requests/:requestId/status
 */
export const updateReplacementRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { 
            status, 
            adminResponse, 
            replacementProductId, 
            replacementQuantity,
            trackingNumber,
            estimatedResolutionDate,
            internalNotes,
            rejectionReason
        } = req.body;
        const adminId = req.user._id;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request ID format'
            });
        }

        // Find the replacement request
        const request = await ReplacementRequest.findById(requestId)
            .populate('user', 'name email')
            .populate('product', 'name image price')
            .populate('order', '_id totalAmount');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Replacement request not found'
            });
        }

        // Check if request can be updated
        if (!request.canBeUpdated()) {
            return res.status(400).json({
                success: false,
                message: 'This request cannot be updated as it is already completed or cancelled'
            });
        }

        // Validate workflow transitions
        if (status === 'approved' && request.status !== 'under_review') {
            return res.status(400).json({
                success: false,
                message: 'Request must be under review before it can be approved'
            });
        }

        if (status === 'rejected') {
            if (request.status !== 'under_review') {
                return res.status(400).json({
                    success: false,
                    message: 'Request must be under review before it can be rejected'
                });
            }
            if (!rejectionReason || rejectionReason.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required when rejecting a request'
                });
            }
        }

        // Validate replacement product if provided
        if (replacementProductId) {
            const replacementProduct = await Product.findById(replacementProductId);
            if (!replacementProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Replacement product not found'
                });
            }
        }

        // Update the request
        const updateData = {
            handledBy: adminId
        };

        if (status) updateData.status = status;
        if (adminResponse) updateData.adminResponse = adminResponse;
        if (replacementProductId) updateData.replacementProduct = replacementProductId;
        if (replacementQuantity) updateData.replacementQuantity = replacementQuantity;
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (estimatedResolutionDate) updateData.estimatedResolutionDate = new Date(estimatedResolutionDate);
        if (internalNotes) updateData.internalNotes = internalNotes;
        if (rejectionReason) updateData.rejectionReason = rejectionReason;

        // Set actual resolution date if status is completed
        if (status === 'completed') {
            updateData.actualResolutionDate = new Date();
        }

        const updatedRequest = await ReplacementRequest.findByIdAndUpdate(
            requestId,
            updateData,
            { new: true, runValidators: true }
        ).populate([
            { path: 'user', select: 'name email' },
            { path: 'order', select: '_id totalAmount' },
            { path: 'product', select: 'name image price' },
            { path: 'replacementProduct', select: 'name image price' },
            { path: 'handledBy', select: 'name email' }
        ]);

        // Send email notification to customer if status changed
        if (status && status !== request.status) {
            try {
                const emailData = {
                    customerName: request.user.name,
                    requestNumber: request.requestNumber,
                    productName: request.product.name,
                    oldStatus: request.status,
                    newStatus: status,
                    adminResponse: adminResponse || '',
                    trackingNumber: trackingNumber || '',
                    requestDate: request.createdAt.toLocaleDateString(),
                    updateDate: new Date().toLocaleDateString()
                };

                await sendEmail(
                    [request.user.email],
                    'Replacement Request Status Update',
                    REPLACEMENT_REQUEST_STATUS_UPDATE_TEMPLATE,
                    emailData
                );
            } catch (emailError) {
                console.error('Error sending status update email:', emailError);
                // Don't fail the update if email fails
            }

            // Send notification to customer about status update
            try {
                await notificationService.sendReplacementRequestStatusUpdateNotification(updatedRequest, status);
            } catch (notificationError) {
                console.error('Error sending replacement request status update notification:', notificationError);
                // Don't fail the update if notification fails
            }
        }

        res.status(200).json({
            success: true,
            data: updatedRequest,
            message: 'Replacement request status updated successfully'
        });

    } catch (error) {
        console.error('Update replacement request status error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update replacement request status',
            error: error.message
        });
    }
};

/**
 * Get replacement request statistics for admin
 * GET /api/admin/replacement-requests/stats
 */
export const getReplacementRequestStats = async (req, res) => {
    try {
        const stats = await ReplacementRequest.getStats();

        // Get additional analytics
        const recentRequests = await ReplacementRequest.find()
            .populate('user', 'name email')
            .populate('product', 'name category')
            .sort({ createdAt: -1 })
            .limit(5);

        const statusDistribution = await ReplacementRequest.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const priorityDistribution = await ReplacementRequest.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        const reasonDistribution = await ReplacementRequest.aggregate([
            {
                $group: {
                    _id: '$reason',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                ...stats,
                recentRequests,
                statusDistribution,
                priorityDistribution,
                reasonDistribution
            },
            message: 'Replacement request statistics retrieved successfully'
        });

    } catch (error) {
        console.error('Get replacement request stats error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve replacement request statistics',
            error: error.message
        });
    }
};

/**
 * Cancel a replacement request (Customer only)
 * PATCH /api/replacement-requests/:requestId/cancel
 */
export const cancelReplacementRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request ID format'
            });
        }

        // Find the replacement request
        const request = await ReplacementRequest.findOne({ _id: requestId, user: userId });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Replacement request not found or access denied'
            });
        }

        // Check if request can be cancelled
        const cancellableStatuses = ['pending', 'under_review'];
        if (!cancellableStatuses.includes(request.status)) {
            return res.status(400).json({
                success: false,
                message: 'This request cannot be cancelled as it is already being processed'
            });
        }

        // Update the request status
        const updatedRequest = await ReplacementRequest.findByIdAndUpdate(
            requestId,
            { status: 'cancelled' },
            { new: true, runValidators: true }
        ).populate([
            { path: 'user', select: 'name email' },
            { path: 'order', select: '_id totalAmount' },
            { path: 'product', select: 'name image price' }
        ]);

        res.status(200).json({
            success: true,
            data: updatedRequest,
            message: 'Replacement request cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel replacement request error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel replacement request',
            error: error.message
        });
    }
};

/**
 * Get replacement request details for admin
 * GET /api/admin/replacement-requests/:requestId
 */
export const getAdminReplacementRequestDetails = async (req, res) => {
    try {
        const { requestId } = req.params;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request ID format'
            });
        }

        // Find request
        const request = await ReplacementRequest.findById(requestId)
            .populate('user', 'name email phone address')
            .populate('order', '_id totalAmount createdAt shippingInfo')
            .populate('product', 'name image price category description')
            .populate('replacementProduct', 'name image price category description')
            .populate('handledBy', 'name email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Replacement request not found'
            });
        }

        res.status(200).json({
            success: true,
            data: request,
            message: 'Replacement request details retrieved successfully'
        });

    } catch (error) {
        console.error('Get admin replacement request details error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve replacement request details',
            error: error.message
        });
    }
};
