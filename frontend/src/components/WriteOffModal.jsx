import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Check, AlertTriangle, Package, DollarSign, Hash, FileText, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const WriteOffModal = ({ isOpen, onClose, onSubmit, writeOff, products }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedWeightOption, setSelectedWeightOption] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const categories = [
        { value: 'beef', label: 'Beef', icon: '🥩' },
        { value: 'chicken', label: 'Chicken', icon: '🐔' },
        { value: 'pork', label: 'Pork', icon: '🐷' },
        { value: 'seafood', label: 'Seafood', icon: '🐟' },
        { value: 'processed', label: 'Processed', icon: '🥓' },
        { value: 'sliced', label: 'Sliced', icon: '🔪' }
    ];

    const reasons = [
        { value: 'expired', label: 'Expired' },
        { value: 'damaged', label: 'Damaged' },
        { value: 'defective', label: 'Defective' },
        { value: 'spoiled', label: 'Spoiled' },
        { value: 'lost', label: 'Lost' },
        { value: 'theft', label: 'Theft' },
        { value: 'quality_issue', label: 'Quality Issue' },
        { value: 'other', label: 'Other' }
    ];

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setSelectedCategory('');
            setSelectedProduct(null);
            setSelectedWeightOption(null);
            setQuantity('');
            setReason('');
            setDescription('');
            setShowConfirmation(false);
        }
    }, [isOpen, products]);

    // Get products filtered by category
    const getProductsByCategory = () => {
        if (!selectedCategory) return [];
        return products.filter(product => product.category === selectedCategory);
    };

    // Get weight options for selected product
    const getWeightOptions = () => {
        if (!selectedProduct || !selectedProduct.weightOptions) return [];
        return selectedProduct.weightOptions.map(option => ({
            ...option,
            price: selectedProduct.basePricePerKg * option.weightKg
        }));
    };

    // Calculate total cost
    const getTotalCost = () => {
        if (!selectedWeightOption || !quantity) return 0;
        return selectedWeightOption.price * parseFloat(quantity);
    };

    // Navigation functions
    const nextStep = () => {
        if (currentStep < 6) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProduct || !selectedWeightOption || !quantity || !reason || !description) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (parseFloat(quantity) <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }

        if (parseFloat(quantity) > selectedWeightOption.stockUnits) {
            toast.error(`Quantity cannot exceed available stock (${selectedWeightOption.stockUnits})`);
            return;
        }

        setIsSubmitting(true);
        try {
            const writeOffData = {
                productId: selectedProduct._id,
                weightOptionId: selectedWeightOption._id,
                weightKg: selectedWeightOption.weightKg,
                quantity: parseFloat(quantity),
                reason,
                description,
                cost: getTotalCost(),
                productName: selectedProduct.name,
                productCategory: selectedProduct.category
            };

            await onSubmit(writeOffData);
            toast.success('Write-off created successfully');
            onClose();
        } catch (error) {
            console.error('Error creating write-off:', error);
            toast.error('Failed to create write-off');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setSelectedProduct(null);
        setSelectedWeightOption(null);
        setQuantity('');
        nextStep();
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSelectedWeightOption(null);
        setQuantity('');
        nextStep();
    };

    const handleWeightOptionSelect = (weightOption) => {
        setSelectedWeightOption(weightOption);
        setQuantity('');
        nextStep();
    };

    const handleQuantityNext = () => {
        if (!quantity || parseFloat(quantity) <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }
        if (parseFloat(quantity) > selectedWeightOption.stockUnits) {
            toast.error(`Quantity cannot exceed available stock (${selectedWeightOption.stockUnits})`);
            return;
        }
        nextStep();
    };

    const handleReasonNext = () => {
        if (!reason || !description.trim()) {
            toast.error('Please select a reason and provide a description');
            return;
        }
        nextStep();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-[9998]"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full z-[9999]"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 relative z-[10000] pointer-events-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Create Write-off - Step {currentStep} of 6
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {currentStep === 1 && 'Select a product category'}
                                            {currentStep === 2 && 'Choose a product'}
                                            {currentStep === 3 && 'Select weight option'}
                                            {currentStep === 4 && 'Enter quantity'}
                                            {currentStep === 5 && 'Provide reason and description'}
                                            {currentStep === 6 && 'Review and confirm'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Progress</span>
                                    <span className="text-sm text-gray-600">{currentStep}/6</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-[#82695b] h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(currentStep / 6) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Step Content */}
                            <div className="min-h-[400px]">
                                {/* Step 1: Category Selection */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">Select Product Category</h4>
                                        {products.length === 0 ? (
                                            <div className="text-center py-8">
                                                <div className="text-gray-500 mb-4">No products available. Please refresh the page.</div>
                                                <button
                                                    onClick={() => window.location.reload()}
                                                    className="px-4 py-2 bg-[#82695b] text-white rounded-lg hover:bg-[#6b5649] transition-colors"
                                                >
                                                    Refresh Page
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                {categories.map(category => (
                                                <button
                                                    key={category.value}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleCategorySelect(category.value);
                                                    }}
                                                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-[#82695b] hover:bg-[#82695b] hover:text-white transition-all group pointer-events-auto relative z-[10001]"
                                                >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{category.icon}</span>
                                                            <span className="font-medium">{category.label}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2: Product Selection */}
                                {currentStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <button
                                                onClick={prevStep}
                                                className="p-2 text-gray-400 hover:text-gray-600"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <h4 className="text-lg font-medium text-gray-900">
                                                Select Product from {categories.find(c => c.value === selectedCategory)?.label}
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                                            {getProductsByCategory().map(product => (
                                                <button
                                                    key={product._id}
                                                    onClick={() => handleProductSelect(product)}
                                                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-[#82695b] hover:bg-[#82695b] hover:text-white transition-all text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {product.image && (
                                                            <img 
                                                                src={product.image} 
                                                                alt={product.name}
                                                                className="w-12 h-12 object-cover rounded-lg"
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{product.name}</div>
                                                            <div className="text-sm opacity-75">
                                                                {product.weightOptions?.length || 0} weight options
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Weight Option Selection */}
                                {currentStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <button
                                                onClick={prevStep}
                                                className="p-2 text-gray-400 hover:text-gray-600"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <h4 className="text-lg font-medium text-gray-900">
                                                Select Weight Option for {selectedProduct?.name}
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {getWeightOptions().map(weightOption => (
                                                <button
                                                    key={weightOption._id}
                                                    onClick={() => handleWeightOptionSelect(weightOption)}
                                                    className="p-4 rounded-lg border-2 border-gray-200 hover:border-[#82695b] hover:bg-[#82695b] hover:text-white transition-all text-left"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Package className="w-5 h-5" />
                                                            <div>
                                                                <div className="font-medium">{weightOption.weightKg}kg</div>
                                                                <div className="text-sm opacity-75">
                                                                    {weightOption.stockUnits} units available
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-medium">₱{weightOption.price.toFixed(2)}</div>
                                                            <div className="text-sm opacity-75">per unit</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Quantity Input */}
                                {currentStep === 4 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <button
                                                onClick={prevStep}
                                                className="p-2 text-gray-400 hover:text-gray-600"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <h4 className="text-lg font-medium text-gray-900">Enter Quantity</h4>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600">Selected Product:</span>
                                                <span className="font-medium">{selectedProduct?.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-600">Weight:</span>
                                                <span className="font-medium">{selectedWeightOption?.weightKg}kg</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Available Stock:</span>
                                                <span className="font-medium text-green-600">{selectedWeightOption?.stockUnits} units</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Quantity <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={selectedWeightOption?.stockUnits}
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                                                placeholder="Enter quantity"
                                            />
                                            <div className="mt-2 text-sm text-gray-500">
                                                Max: {selectedWeightOption?.stockUnits} units
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleQuantityNext}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#82695b] text-white rounded-lg hover:bg-[#6b5649] transition-colors"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                            Next
                                        </button>
                                    </div>
                                )}

                                {/* Step 5: Reason and Description */}
                                {currentStep === 5 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <button
                                                onClick={prevStep}
                                                className="p-2 text-gray-400 hover:text-gray-600"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <h4 className="text-lg font-medium text-gray-900">Reason and Description</h4>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Reason <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                                            >
                                                <option value="">Select a reason</option>
                                                {reasons.map(reasonOption => (
                                                    <option key={reasonOption.value} value={reasonOption.value}>
                                                        {reasonOption.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                                                placeholder="Provide detailed description of the write-off..."
                                            />
                                        </div>
                                        <button
                                            onClick={handleReasonNext}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#82695b] text-white rounded-lg hover:bg-[#6b5649] transition-colors"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                            Next
                                        </button>
                                    </div>
                                )}

                                {/* Step 6: Summary and Confirmation */}
                                {currentStep === 6 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <button
                                                onClick={prevStep}
                                                className="p-2 text-gray-400 hover:text-gray-600"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <h4 className="text-lg font-medium text-gray-900">Write-off Summary</h4>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Product:</span>
                                                <span className="font-medium">{selectedProduct?.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Category:</span>
                                                <span className="font-medium">{categories.find(c => c.value === selectedCategory)?.label}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Weight:</span>
                                                <span className="font-medium">{selectedWeightOption?.weightKg}kg</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Quantity:</span>
                                                <span className="font-medium">{quantity} units</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Unit Price:</span>
                                                <span className="font-medium">₱{selectedWeightOption?.price.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Reason:</span>
                                                <span className="font-medium">{reasons.find(r => r.value === reason)?.label}</span>
                                            </div>
                                            <div className="border-t border-gray-200 pt-3">
                                                <div className="flex items-center justify-between text-lg font-semibold">
                                                    <span>Total Cost:</span>
                                                    <span className="text-red-600">₱{getTotalCost().toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="flex items-start gap-2">
                                                <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                                                <div>
                                                    <div className="text-sm font-medium text-blue-900">Description:</div>
                                                    <div className="text-sm text-blue-700 mt-1">{description}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={prevStep}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                                Back
                                            </button>
                                            <button
                                                onClick={() => setShowConfirmation(true)}
                                                disabled={isSubmitting}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#82695b] text-white rounded-lg hover:bg-[#6b5649] transition-colors disabled:opacity-50"
                                            >
                                                <Check className="w-4 h-4" />
                                                {isSubmitting ? 'Creating...' : 'Create Write-off'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirmation Dialog */}
                            {showConfirmation && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-yellow-100 rounded-lg">
                                                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900">Confirm Write-off</h3>
                                        </div>
                                        <p className="text-gray-600 mb-6">
                                            Are you sure you want to create this write-off? This action will reduce the stock and cannot be undone.
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowConfirmation(false)}
                                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Creating...' : 'Confirm'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

export default WriteOffModal;