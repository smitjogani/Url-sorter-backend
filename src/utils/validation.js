import validator from 'validator';

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url) {
    return validator.isURL(url, {
        protocols: ['http', 'https'],
        require_protocol: true,
    });
}

/**
 * Validates if a code matches the required pattern [A-Za-z0-9]{6,8}
 */
export function isValidCode(code) {
    const codeRegex = /^[A-Za-z0-9]{6,8}$/;
    return codeRegex.test(code);
}

/**
 * Generates a random code of length 6-8
 */
export function generateRandomCode() {
    const length = Math.floor(Math.random() * 3) + 6; // 6, 7, or 8
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

