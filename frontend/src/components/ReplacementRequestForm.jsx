import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useReplacementRequestStore } from '../store/replacementRequestStore';

const ReplacementRequestForm = ({ order, product, onSuccess, onCancel }) => {
    const { createReplacementRequest, isLoading, error, message } = useReplacementRequestStore();
    const [formData, setFormData] = useState({
        orderId: order?._id || '',
        productId: product?._id || '',
        quantity: 1,
        reason: '',
        description: '',
        contactNumber: '',
        images: []
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const fileInputRef = useRef(null);

    const reasons = [
        { value: 'defective', label: 'Defective Product' },
        { value: 'wrong_item', label: 'Wrong Item Received' },
        { value: 'damaged_during_shipping', label: 'Damaged During Shipping' },
        { value: 'quality_issue', label: 'Quality Issue' },
        { value: 'not_as_described', label: 'Not As Described' },
        { value: 'expired_product', label: 'Expired Product' },
        { value: 'other', label: 'Other' }
    ];


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File size must be less than 5MB');
                return false;
            }
            if (!file.type.startsWith('image/')) {
                alert('Only image files are allowed');
                return false;
            }
            return true;
        });

        if (imageFiles.length + validFiles.length > 5) {
            alert('Maximum 5 images allowed');
            return;
        }

        setImageFiles(prev => [...prev, ...validFiles]);
        
        // Create preview URLs
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(prev => [...prev, {
                    file,
                    url: e.target.result
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreview(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.reason || !formData.description || !formData.contactNumber || imageFiles.length === 0) {
            return;
        }

        try {
            // Convert images to base64 for upload
            const imagePromises = imageFiles.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            });

            const imageBase64 = await Promise.all(imagePromises);
            
            const requestData = {
                ...formData,
                images: imageBase64
            };

            await createReplacementRequest(requestData);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error creating replacement request:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-xl border border-gray-300 p-8 bg-[#fffefc]"
        >
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#860809] mb-2 font-libre">
                    Request Product Replacement
                </h2>
                <p className="text-[#a31f17] font-libre">
                    Fill out the form below to request a replacement for your product.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
            )}

            {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <p className="text-green-800">{message}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Information */}
                <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium text-[#860809] mb-2 font-libre">Product Information</h3>
                    <div className="flex items-center gap-4">
                        {product?.image && (
                            <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded"
                            />
                        )}
                        <div>
                            <p className="font-medium text-[#030105] font-alice">{product?.name}</p>
                            <p className="text-sm text-[#a31f17] font-libre">Order #{order?._id?.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Quantity */}
                <div>
                    <label className="block text-sm font-medium text-[#a31f17] mb-2 font-alice">
                        Quantity to Replace
                    </label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        max={product?.quantity || 1}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-[#860809] transition-all duration-200"
                        required
                    />
                    <p className="text-sm text-[#a31f17] mt-1 font-libre">
                        Maximum: {product?.quantity || 1} (ordered quantity)
                    </p>
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-medium text-[#a31f17] mb-2 font-alice">
                        Reason for Replacement *
                    </label>
                    <select
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-[#860809] transition-all duration-200"
                        required
                    >
                        <option value="">Select a reason</option>
                        {reasons.map(reason => (
                            <option key={reason.value} value={reason.value}>
                                {reason.label}
                            </option>
                        ))}
                    </select>
                </div>


                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-[#a31f17] mb-2 font-alice">
                        Detailed Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-[#860809] transition-all duration-200 resize-none"
                        placeholder="Please provide detailed information about the issue..."
                        required
                    />
                    <p className="text-sm text-[#a31f17] mt-1 font-libre">
                        {formData.description.length}/1000 characters
                    </p>
                </div>

                {/* Contact Number */}
                <div>
                    <label className="block text-sm font-medium text-[#a31f17] mb-2 font-alice">
                        Contact Number *
                    </label>
                    <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-[#860809] transition-all duration-200"
                        placeholder="+639123456789 or 09123456789"
                        required
                    />
                    <p className="text-sm text-[#a31f17] mt-1 font-libre">
                        Please provide your Philippine phone number for contact purposes
                    </p>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-[#a31f17] mb-2 font-alice">
                        Upload Images *
                    </label>
                    <div 
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                            imageFiles.length === 0 
                                ? 'border-red-300 bg-red-50/50 hover:border-red-400 hover:bg-red-50/70' 
                                : 'border-green-300 bg-green-50/50 hover:border-green-400 hover:bg-green-50/70'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <div className="flex flex-col items-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                                imageFiles.length === 0 
                                    ? 'bg-red-100' 
                                    : 'bg-green-100'
                            }`}>
                                <Upload className={`h-8 w-8 ${
                                    imageFiles.length === 0 
                                        ? 'text-red-500' 
                                        : 'text-green-500'
                                }`} />
                            </div>
                            <p className={`text-sm font-medium mb-2 ${
                                imageFiles.length === 0 
                                    ? 'text-red-700' 
                                    : 'text-green-700'
                            }`}>
                                {imageFiles.length === 0 
                                    ? 'Click to upload images or drag and drop' 
                                    : `${imageFiles.length} image(s) uploaded - Click to add more`
                                }
                            </p>
                            <p className="text-xs text-gray-500 mb-4">
                                PNG, JPG, GIF up to 5MB each (max 5 images)
                            </p>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
                                    imageFiles.length === 0 
                                        ? 'bg-red-600 hover:bg-red-700' 
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {imageFiles.length === 0 ? 'Choose Files' : 'Add More Files'}
                            </button>
                        </div>
                    </div>

                    {/* Image Previews */}
                    {imagePreview.length > 0 && (
                        <div className="mt-6">
                            <p className="text-sm font-medium text-[#a31f17] mb-3 font-alice">
                                Uploaded Images ({imagePreview.length}/5)
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {imagePreview.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-red-300 transition-colors">
                                            <img
                                                src={preview.url}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-all duration-200 transform scale-75 group-hover:scale-100"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[#a31f17] mt-1 text-center truncate font-libre">
                                            {preview.file.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-8 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-[#a31f17] rounded-lg hover:bg-[#f8f3ed] hover:border-[#860809] transition-all duration-200 font-medium font-alice"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !formData.reason || !formData.description || !formData.contactNumber || imageFiles.length === 0}
                        className="flex-1 px-6 py-3 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none font-alice"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                            </span>
                        ) : (
                            'Submit Request'
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default ReplacementRequestForm;
