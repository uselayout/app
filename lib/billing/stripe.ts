import Stripe from "stripe";
import { STRIPE_CONFIG } from "./constants";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!STRIPE_CONFIG.secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(STRIPE_CONFIG.secretKey, {
      typescript: true,
    });
  }
  return _stripe;
}
