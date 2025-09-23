import Stripe from "stripe";
import '../utils/env.js';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);