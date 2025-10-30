/**
 * Email validation utility for frontend
 * Uses RFC 5322 compliant regex for email format validation
 */

export const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email format is valid
 */
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    // Basic regex check
    if (!emailRegex.test(email)) {
        return false;
    }
    
    const parts = email.split('@');
    if (parts.length !== 2) {
        return false;
    }
    
    const [localPart, domainPart] = parts;
    
    if (domainPart.includes('..')) {
        return false;
    }
    
    if (localPart.includes('..')) {
        return false;
    }
    
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) {
        return false;
    }
    
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
        return false;
    }
    
    const fakeDomains = ['test.com', 'example.com', 'fake.com', 'dummy.com'];
    if (fakeDomains.includes(domainPart.toLowerCase())) {
        return false;
    }
    
    if (domainParts.length >= 3) {
        const lastTwoParts = domainParts.slice(-2);
        if (lastTwoParts[0] === lastTwoParts[1]) {
            return false;
        }
        
        for (let i = 0; i < domainParts.length - 1; i++) {
            const currentPart = domainParts[i];
            const nextPart = domainParts[i + 1];
            if (currentPart === nextPart) {
                return false;
            }
        }
    }
    
    return true;
};

/**
 * Validates email and returns error message if invalid
 * @param {string} email - Email address to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateEmailFormat = (email) => {
    if (!isValidEmail(email)) {
        return "Please enter a valid email address";
    }
    return null;
};
