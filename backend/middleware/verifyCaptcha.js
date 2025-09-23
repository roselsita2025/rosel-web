import '../utils/env.js';

const PROVIDER = process.env.CAPTCHA_PROVIDER || "recaptcha-v3";
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const MIN_SCORE = parseFloat(process.env.CAPTCHA_MIN_SCORE || "0.5");

export const verifyCaptcha = async (req, res, next) => {
  try {
    const { captchaToken, captchaAction } = req.body || {};
    if (!captchaToken) {
      return res.status(400).json({ success: false, message: "Captcha verification failed" });
    }

    if (PROVIDER === "recaptcha-v3") {
      if (!RECAPTCHA_SECRET_KEY) {
        return res.status(500).json({ success: false, message: "Captcha not configured" });
      }

      const params = new URLSearchParams();
      params.set("secret", RECAPTCHA_SECRET_KEY);
      params.set("response", captchaToken);
      // Optionally include remote IP
      if (req.ip) params.set("remoteip", req.ip);

      const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const data = await response.json();

      const ok = data?.success === true && typeof data?.score === "number" && data.score >= MIN_SCORE;
      const actionOk = !captchaAction || !data?.action || data.action === captchaAction;

      if (!ok || !actionOk) {
        return res.status(400).json({ success: false, message: "Captcha verification failed" });
      }
    } else {
      return res.status(500).json({ success: false, message: "Unsupported captcha provider" });
    }

    next();
  } catch (error) {
    console.error("Error in verifyCaptcha:", error);
    return res.status(400).json({ success: false, message: "Captcha verification failed" });
  }
};


