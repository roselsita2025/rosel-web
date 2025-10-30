// Philippine phone number validation and formatting
export const validatePhilippinePhone = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('63')) {
        if (cleanPhone.length === 11) {
            return {
                isValid: true,
                formatted: `+${cleanPhone}`,
                clean: cleanPhone
            };
        }
    } else if (cleanPhone.startsWith('0')) {
        if (cleanPhone.length === 11) {
            return {
                isValid: true,
                formatted: `+63${cleanPhone.substring(1)}`,
                clean: `63${cleanPhone.substring(1)}`
            };
        }
    }
    
    return {
        isValid: false,
        formatted: phone,
        clean: cleanPhone
    };
};

export const formatPhoneInput = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.startsWith('63') && cleanValue.length <= 11) {
        const number = cleanValue.substring(2);
        if (number.length <= 9) {
            const formatted = number.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
            return `+63 ${formatted}`.trim();
        }
    }
    
    if (cleanValue.startsWith('0') && cleanValue.length <= 11) {
        const number = cleanValue.substring(1);
        if (number.length <= 9) {
            const formatted = number.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
            return `0${formatted}`.trim();
        }
    }
    
    if (cleanValue.length <= 10 && !cleanValue.startsWith('0') && !cleanValue.startsWith('63')) {
        const formatted = cleanValue.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        return `0${formatted}`.trim();
    }
    
    return value;
};

export const getPhoneErrorMessage = (phone) => {
    const validation = validatePhilippinePhone(phone);
    
    if (validation.isValid) {
        return null;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 0) {
        return "Phone number is required";
    }
    
    if (cleanPhone.length < 10) {
        return "Phone number is too short";
    }
    
    if (cleanPhone.length > 11) {
        return "Phone number is too long";
    }
    
    if (!cleanPhone.startsWith('63') && !cleanPhone.startsWith('0')) {
        return "Phone number must start with +63 or 0";
    }
    
    return "Invalid phone number format";
};
