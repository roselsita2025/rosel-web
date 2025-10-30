import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, User, Phone, Mail, Home, Save } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { cartStore } from "../../store/cartStore";
import OrderSummary from "../../components/CustomerComponents/OrderSummary";
import GiftCouponCard from "../../components/CustomerComponents/GiftCouponCard";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const InformationPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const { cart, coupon, isCouponApplied, applyCoupon, removeCoupon } = cartStore();

    const [formData, setFormData] = useState({
        email: user?.email || "",
        firstName: "",
        lastName: "",
        address: "",
        barangay: "",
        postalCode: "",
        city: "",
        province: "",
        phone: "",
        saveInfo: false
    });

    const [mapCenter, setMapCenter] = useState({ lat: 14.5995, lng: 120.9842 }); // Manila default
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locationRequired, setLocationRequired] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodeSuccess, setGeocodeSuccess] = useState(false);
    const [locationConfirmed, setLocationConfirmed] = useState(false);

    const luzonProvinces = [
        "Metro Manila", "Bulacan", "Pampanga", "Tarlac", "Nueva Ecija", "Bataan", "Zambales",
        "Aurora", "Quezon", "Rizal", "Laguna", "Cavite", "Batangas", "Camarines Norte",
        "Camarines Sur", "Catanduanes", "Albay", "Sorsogon", "Masbate", "Marinduque",
        "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon", "Abra", "Benguet",
        "Ifugao", "Kalinga", "Apayao", "Mountain Province", "Ilocos Norte", "Ilocos Sur",
        "La Union", "Pangasinan", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"
    ];

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user?.role !== 'customer') {
            navigate('/');
            return;
        }

        if (user?.address) {
            setFormData(prev => ({
                ...prev,
                email: user.email || "",
                firstName: user.name?.split(' ')[0] || "",
                lastName: user.name?.split(' ').slice(1).join(' ') || "",
                address: user.address.street || "",
                barangay: user.address.barangay || "",
                postalCode: user.address.postalCode || "",
                city: user.address.city || "",
                province: user.address.province || "",
                phone: user.phone || ""
            }));
        }

        initializeMap();
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'customer') {
            const mapElement = document.getElementById('google-map');
            if (mapElement && !map && window.google && window.google.maps) {
                initializeMap();
            }
        }
    }, [isAuthenticated, user, map]);

    const initializeMap = () => {
        
        if (window.google && window.google.maps) {
            const mapElement = document.getElementById('google-map');
            
            if (mapElement && !map) {
                const googleMap = new window.google.maps.Map(mapElement, {
                    center: mapCenter,
                    zoom: 15,
                    mapTypeId: 'roadmap',
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        }
                    ]
                });

                const googleMarker = new window.google.maps.Marker({
                    position: mapCenter,
                    map: googleMap,
                    draggable: true,
                    title: 'Delivery Location'
                });

                googleMap.addListener('click', (event) => {
                    const lat = event.latLng.lat();
                    const lng = event.latLng.lng();
                    googleMarker.setPosition({ lat, lng });
                    setSelectedLocation({ lat, lng });
                    setLocationConfirmed(false); // Reset confirmation when new location is selected
                });

                googleMarker.addListener('dragend', (event) => {
                    const lat = event.latLng.lat();
                    const lng = event.latLng.lng();
                    setSelectedLocation({ lat, lng });
                    setLocationConfirmed(false); // Reset confirmation when new location is selected
                });

                setMap(googleMap);
                setMarker(googleMarker);
                setIsMapLoaded(true);
            }
        } else {
            if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
                const apiKey = import.meta.env.VITE_MAPS_PLATFORM_API_KEY;
                
                if (!apiKey) {
                    console.error('VITE_MAPS_PLATFORM_API_KEY is not defined in environment variables');
                    setMapError('Google Maps API key not configured');
                    return;
                }
                
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    setTimeout(initializeMap, 100);
                };
                script.onerror = () => {
                    console.error('Failed to load Google Maps script');
                    setMapError('Failed to load Google Maps');
                };
                document.head.appendChild(script);
            } else {
                setTimeout(initializeMap, 100);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let processedValue = value;
        if (name === 'postalCode') {
            processedValue = value.replace(/\D/g, ''); // Remove all non-digit characters
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : processedValue
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }
        
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
        }
        
        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }
        if (!formData.barangay.trim()) {
            newErrors.barangay = "Barangay is required";
        }
        if (!formData.postalCode.trim()) {
            newErrors.postalCode = "Postal code is required";
        }
        if (!formData.city.trim()) {
            newErrors.city = "City is required";
        }
        if (!formData.province) {
            newErrors.province = "Province is required";
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^(\+63|0)9\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = "Please enter a valid Philippine phone number (+63xxx xxx xxxx)";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGeocodeAddress = async () => {
        if (!formData.address || !formData.barangay || !formData.city || !formData.province) {
            toast.error("Please fill in address, barangay, city, and province first");
            return;
        }

        setIsGeocoding(true);
        setGeocodeSuccess(false);

        try {
            const fullAddress = `${formData.address}, ${formData.barangay}, ${formData.city}, ${formData.province}, Philippines`;
            
            const response = await axios.post(`${API_URL}/maps/geocode`, {
                address: fullAddress
            });

            if (response.data.success) {
                const { lat, lng, formatted_address } = response.data.data;
                const newLocation = { lat, lng, address: formatted_address };
                
                setMapCenter({ lat, lng });
                setSelectedLocation(newLocation);
                setLocationConfirmed(false); // Reset confirmation when new location is found
                
                if (map && marker) {
                    map.setCenter({ lat, lng });
                    marker.setPosition({ lat, lng });
                }
                
                setGeocodeSuccess(true);
                setTimeout(() => {
                    setGeocodeSuccess(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            toast.error("Failed to locate address on map");
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleLocationConfirm = () => {
        if (selectedLocation) {
            setLocationConfirmed(true);
            setLocationRequired(false);
        } else {
            toast.error("Please select a location on the map first");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error("Please fix the errors before proceeding");
            return;
        }

        if (!locationConfirmed) {
            setLocationRequired(true);
            const locationContainer = document.querySelector('[data-location-container]');
            if (locationContainer) {
                locationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                locationContainer.classList.add('ring-4', 'ring-red-500', 'ring-opacity-50');
                setTimeout(() => {
                    locationContainer.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-50');
                }, 3000);
            }
            return;
        }

        setIsSubmitting(true);

        try {
            if (formData.saveInfo) {
                const addressData = {
                    street: formData.address,
                    barangay: formData.barangay,
                    city: formData.city,
                    province: formData.province,
                    postalCode: formData.postalCode,
                    country: "Philippines"
                };

                await axios.patch(`${API_URL}/auth/update-profile`, {
                    phone: formData.phone,
                    address: addressData
                });
            }
            
            const shippingInfo = {
                ...formData,
                coordinates: selectedLocation,
                fullAddress: `${formData.address}, ${formData.barangay}, ${formData.city}, ${formData.province}, Philippines`
            };

            sessionStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
            
            navigate('/shipping-options');
        } catch (error) {
            console.error('Error saving information:', error);
            toast.error("Failed to save information. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated || user?.role !== 'customer') {
        return null;
    }

    return (
        <div className='min-h-screen pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 md:pb-12 lg:pb-16 bg-[#f8f3ed]'>
            <div className='mx-auto max-w-screen-xl px-3 sm:px-4 md:px-6 lg:px-8 2xl:px-0'>
                {/* Header */}
                <motion.div
                    className='mb-4 sm:mb-6 md:mb-8'
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <button
                        onClick={() => navigate('/carts')}
                        className='inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors hover:opacity-80 mb-3 sm:mb-4 text-[#860809] font-alice'
                    >
                        <ArrowLeft className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                        Back to Cart
                    </button>
                    
                    <h1 className='text-2xl sm:text-3xl font-bold text-[#860809] font-libre'>
                        Shipping Information
                    </h1>
                    <p className='text-xs sm:text-sm mt-1.5 sm:mt-2 text-[#a31f17] font-alice'>
                        Step 1 of 3 - Enter your contact and shipping details
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className='space-y-6 sm:space-y-8'>
                    <div className='grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3'>
                        {/* Left Side - Form */}
                        <motion.div
                            className='lg:col-span-2 space-y-4 sm:space-y-6'
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {/* Contact Information */}
                            <div className='rounded-lg border border-gray-300 p-4 sm:p-6 bg-[#fffefc] shadow-md'>
                                <h2 className='text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-[#860809] font-libre'>
                                    <User className='w-4 h-4 sm:w-5 sm:h-5' />
                                    Contact Information
                                </h2>
                                
                                <div className='space-y-3 sm:space-y-4'>
                                    <div>
                                        <label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>
                                            Email Address *
                                        </label>
                                        <div className='relative'>
                                            <Mail className='w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 transform -translate-y-1/2' style={{ color: '#a31f17' }} />
                                            <input
                                                type='email'
                                                name='email'
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] text-sm sm:text-base ${
                                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                style={{ backgroundColor: '#fffefc' }}
                                                placeholder='your@email.com'
                                            />
                                        </div>
                                        {errors.email && <p className='text-red-500 text-xs sm:text-sm mt-1'>{errors.email}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className='rounded-lg border border-gray-300 p-4 sm:p-6 bg-[#fffefc] shadow-md'>
                                <h2 className='text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-[#860809] font-libre'>
                                    <Home className='w-4 h-4 sm:w-5 sm:h-5' />
                                    Shipping Address
                                </h2>
                                
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                                    <div>
                                        <label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>
                                            First Name *
                                        </label>
                                        <input
                                            type='text'
                                            name='firstName'
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] text-sm sm:text-base ${
                                                errors.firstName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: '#fffefc' }}
                                            placeholder='First Name'
                                        />
                                        {errors.firstName && <p className='text-red-500 text-xs sm:text-sm mt-1'>{errors.firstName}</p>}
                                    </div>

                                    <div>
                                        <label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>
                                            Last Name *
                                        </label>
                                        <input
                                            type='text'
                                            name='lastName'
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] text-sm sm:text-base ${
                                                errors.lastName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: '#fffefc' }}
                                            placeholder='Last Name'
                                        />
                                        {errors.lastName && <p className='text-red-500 text-xs sm:text-sm mt-1'>{errors.lastName}</p>}
                                    </div>

                                    <div className='sm:col-span-2'>
                                        <label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>
                                            Address *
                                        </label>
                                        <input
                                            type='text'
                                            name='address'
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] text-sm sm:text-base ${
                                                errors.address ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: '#fffefc' }}
                                            placeholder='Street Address'
                                        />
                                        {errors.address && <p className='text-red-500 text-xs sm:text-sm mt-1'>{errors.address}</p>}
                                    </div>

                                    <div>
                                        <label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>
                                            Barangay *
                                        </label>
                                        <input
                                            type='text'
                                            name='barangay'
                                            value={formData.barangay}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] text-sm sm:text-base ${
                                                errors.barangay ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: '#fffefc' }}
                                            placeholder='Barangay'
                                        />
                                        {errors.barangay && <p className='text-red-500 text-xs sm:text-sm mt-1'>{errors.barangay}</p>}
                                    </div>

                                    <div>
                                        <label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>
                                            Postal Code *
                                        </label>
                                        <input
                                            type='text'
                                            name='postalCode'
                                            value={formData.postalCode}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] text-sm sm:text-base ${
                                                errors.postalCode ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: '#fffefc' }}
                                            placeholder='1234'
                                            pattern='[0-9]*'
                                            inputMode='numeric'
                                        />
                                        {errors.postalCode && <p className='text-red-500 text-xs sm:text-sm mt-1'>{errors.postalCode}</p>}
                                    </div>

                                    <div>
                                        <label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>
                                            City *
                                        </label>
                                        <input
                                            type='text'
                                            name='city'
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] text-sm sm:text-base ${
                                                errors.city ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: '#fffefc' }}
                                            placeholder='City'
                                        />
                                        {errors.city && <p className='text-red-500 text-xs sm:text-sm mt-1'>{errors.city}</p>}
                                    </div>

                                    <div>
                                        <label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>
                                            Province *
                                        </label>
                                        <select
                                            name='province'
                                            value={formData.province}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] text-sm sm:text-base ${
                                                errors.province ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: '#fffefc' }}
                                        >
                                            <option value=''>Select Province</option>
                                            {luzonProvinces.map(province => (
                                                <option key={province} value={province}>{province}</option>
                                            ))}
                                        </select>
                                        {errors.province && <p className='text-red-500 text-xs sm:text-sm mt-1'>{errors.province}</p>}
                                    </div>

                                    <div className='sm:col-span-2'>
                                        <label className='block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>
                                            Phone Number *
                                        </label>
                                        <div className='relative'>
                                            <Phone className='w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 transform -translate-y-1/2' style={{ color: '#a31f17' }} />
                                            <input
                                                type='tel'
                                                name='phone'
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] text-sm sm:text-base ${
                                                    errors.phone ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                style={{ backgroundColor: '#fffefc' }}
                                                placeholder='+63xxx xxx xxxx'
                                            />
                                        </div>
                                        {errors.phone && <p className='text-red-500 text-xs sm:text-sm mt-1'>{errors.phone}</p>}
                                    </div>
                                </div>

                                {/* Save Information Toggle */}
                                <div className='mt-4 sm:mt-6 flex items-center gap-2 sm:gap-3'>
                                    <input
                                        type='checkbox'
                                        id='saveInfo'
                                        name='saveInfo'
                                        checked={formData.saveInfo}
                                        onChange={handleInputChange}
                                        className='w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300'
                                    />
                                    <label htmlFor='saveInfo' className='text-xs sm:text-sm font-medium text-[#a31f17] font-alice'>
                                        Save this information for next time
                                    </label>
                                </div>
                            </div>

                            {/* Google Maps Integration */}
                            <div className={`rounded-lg border p-4 sm:p-6 shadow-md transition-all duration-300 ${
                                locationRequired 
                                    ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                                    : 'border-gray-300 bg-[#fffefc]'
                            }`} data-location-container>
                                <h2 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex flex-wrap items-center gap-2 font-libre ${
                                    locationRequired ? 'text-red-600' : 'text-[#860809]'
                                }`}>
                                    <MapPin className='w-4 h-4 sm:w-5 sm:h-5' />
                                    Location Confirmation
                                    {locationRequired && <span className="text-xs sm:text-sm font-normal text-red-500">(Required)</span>}
                                </h2>
                                
                                <div className='space-y-3 sm:space-y-4'>
                                    <p className={`text-xs sm:text-sm font-libre ${
                                        locationRequired 
                                            ? 'text-red-600 font-medium' 
                                            : 'text-[#a31f17]'
                                    }`}>
                                        {locationRequired 
                                            ? '⚠️ Please confirm your delivery location on the map below to continue.'
                                            : 'Please confirm your delivery location on the map below.'
                                        }
                                    </p>
                                    
                                    <div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
                                        <button
                                            type='button'
                                            onClick={handleGeocodeAddress}
                                            disabled={isGeocoding}
                                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 font-alice ${
                                                geocodeSuccess
                                                    ? 'bg-green-600 text-white'
                                                    : isGeocoding
                                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                                    : 'bg-[#860809] text-white hover:opacity-90'
                                            }`}
                                        >
                                            {isGeocoding ? (
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Locating...
                                                </div>
                                            ) : geocodeSuccess ? (
                                                '✓ Address Located'
                                            ) : (
                                                'Locate Address'
                                            )}
                                        </button>
                                        
                                        {selectedLocation && (
                                            <button
                                                type='button'
                                                onClick={handleLocationConfirm}
                                                disabled={locationConfirmed}
                                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 font-alice ${
                                                    locationConfirmed
                                                        ? 'bg-green-600 text-white cursor-default'
                                                        : 'bg-[#a31f17] text-white hover:opacity-90'
                                                }`}
                                            >
                                                {locationConfirmed ? '✓ Location Confirmed' : 'Confirm Location'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Google Maps */}
                                    <div className='w-full h-48 sm:h-56 md:h-64 border border-gray-300 rounded-lg overflow-hidden'>
                                        {mapError ? (
                                            <div className='w-full h-full flex items-center justify-center' style={{ backgroundColor: '#fef2f2' }}>
                                                <div className='text-center px-4'>
                                                    <MapPin className='w-10 h-10 sm:w-12 sm:h-12' style={{ color: '#ef4444' }} />
                                                    <p className='text-xs sm:text-sm font-medium mt-2' style={{ color: '#ef4444' }}>
                                                        {mapError}
                                                    </p>
                                                    <p className='text-xs mt-1' style={{ color: '#dc2626' }}>
                                                        Please check your API key configuration
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-full">
                                                <div id="google-map" className="w-full h-full"></div>
                                                {!isMapLoaded && (
                                                    <div className='absolute inset-0 flex items-center justify-center' style={{ backgroundColor: '#f8f3ed' }}>
                                                        <div className='text-center px-4'>
                                                            <MapPin className='w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2' style={{ color: '#a31f17' }} />
                                                            <p className='text-xs sm:text-sm' style={{ color: '#a31f17' }}>
                                                                Loading Google Maps...
                                                            </p>
                                                            <p className='text-xs mt-1' style={{ color: '#860809' }}>
                                                                Click "Locate Address" to find your location
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </motion.div>

                        {/* Right Side - Order Summary and Coupon */}
                        <motion.div
                            className='space-y-4 sm:space-y-6'
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            {/* Order Summary Component */}
                            <OrderSummary hideActions={true} />
                            
                            {/* Coupon Section */}
                            <GiftCouponCard />
                        </motion.div>
                    </div>

                    {/* Submit Button */}
                    <motion.div
                        className='flex justify-end'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className='w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-4 disabled:opacity-50 bg-[#860809] font-alice text-sm sm:text-base'
                        >
                            {isSubmitting ? (
                                <>
                                    <div className='w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[#feffff] border-t-[#ffd901] rounded-full animate-spin'></div>
                                    <span className='hidden sm:inline'>Processing...</span>
                                    <span className='sm:hidden'>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span className='hidden sm:inline'>Continue to Shipping Options</span>
                                    <span className='sm:hidden'>Continue</span>
                                    <ArrowLeft className='w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180' />
                                </>
                            )}
                        </button>
                    </motion.div>
                </form>
            </div>
        </div>
    );
};

export default InformationPage;
