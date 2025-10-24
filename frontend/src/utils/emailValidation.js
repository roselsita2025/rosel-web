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
    
    // Additional checks for common invalid patterns
    const parts = email.split('@');
    if (parts.length !== 2) {
        return false;
    }
    
    const [localPart, domainPart] = parts;
    
    // Check for double dots in domain
    if (domainPart.includes('..')) {
        return false;
    }
    
    // Check for consecutive dots in local part
    if (localPart.includes('..')) {
        return false;
    }
    
    // Check for valid TLD (at least 2 characters)
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) {
        return false;
    }
    
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
        return false;
    }
    
    // Check for common fake domains
    const fakeDomains = ['test.com', 'example.com', 'fake.com', 'dummy.com'];
    if (fakeDomains.includes(domainPart.toLowerCase())) {
        return false;
    }
    
    // Check for double domain pattern (e.g., gmail.com.com, yahoo.com.com)
    if (domainParts.length >= 3) {
        // Check if the last two parts are the same (e.g., com.com, org.org)
        const lastTwoParts = domainParts.slice(-2);
        if (lastTwoParts[0] === lastTwoParts[1]) {
            return false;
        }
        
        // Check for repeated domain patterns (e.g., gmail.com.com)
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
