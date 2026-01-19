export const getRecaptchaInstance = () => (globalThis as any).window.grecaptcha?.enterprise;
