/**
 * Worker entry point — route les requêtes /api/* vers les handlers,
 * le reste tombe sur les static assets (binding ASSETS).
 */
import { onRequestPost as createCheckoutSession } from "./functions/api/create-checkout-session.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API : création session Stripe Checkout
    if (url.pathname === "/api/create-checkout-session") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      return createCheckoutSession({ request, env, ctx });
    }

    // Static assets (HTML, CSS, JS, images)
    return env.ASSETS.fetch(request);
  }
};
