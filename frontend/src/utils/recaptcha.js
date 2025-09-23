const scriptId = "grecaptcha-v3-script";

const loadRecaptcha = (siteKey) => {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha && window.grecaptcha.execute) return resolve();
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
};

export const getRecaptchaToken = async (action = "general") => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey) throw new Error("Missing VITE_RECAPTCHA_SITE_KEY");
  await loadRecaptcha(siteKey);
  await new Promise((r) => window.grecaptcha.ready(r));
  return window.grecaptcha.execute(siteKey, { action });
};


