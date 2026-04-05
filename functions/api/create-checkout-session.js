/**
 * Cloudflare Pages Function — crée une Stripe Checkout Session
 *
 * Environment variables à définir dans Cloudflare Pages → Settings → Environment Variables :
 *   STRIPE_SECRET_KEY  (ex. sk_test_xxx ou sk_live_xxx)
 *
 * Endpoint : POST /api/create-checkout-session
 * Body JSON : { coffret:{name,image}, price_unit, quantity, customer_email, customer_name, metadata }
 * Retour : { url } ou { error }
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "STRIPE_SECRET_KEY manquante côté serveur." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON invalide." }, 400);
  }

  const { coffret, price_unit, quantity, customer_email, customer_name, metadata } = body || {};

  /* Validation basique */
  if (!coffret || !coffret.name) return json({ error: "Coffret manquant." }, 400);
  const price = Number(price_unit);
  const qty = parseInt(quantity, 10);
  if (!Number.isFinite(price) || price < 1 || price > 10000) return json({ error: "Prix invalide." }, 400);
  if (!Number.isInteger(qty) || qty < 5 || qty > 10000) return json({ error: "Quantité invalide (min 5)." }, 400);
  if (!customer_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer_email)) return json({ error: "Email invalide." }, 400);

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("locale", "fr");
  params.append("customer_email", customer_email);

  /* Line item dynamique */
  params.append("line_items[0][price_data][currency]", "eur");
  params.append("line_items[0][price_data][unit_amount]", String(Math.round(price * 100)));
  params.append("line_items[0][price_data][product_data][name]", coffret.name);
  params.append("line_items[0][price_data][product_data][description]", "Coffret personnalisé — Maison B");
  if (coffret.image && /^https?:\/\//.test(coffret.image)) {
    params.append("line_items[0][price_data][product_data][images][0]", coffret.image);
  }
  params.append("line_items[0][quantity]", String(qty));

  /* Livraison FR */
  params.append("shipping_address_collection[allowed_countries][0]", "FR");
  params.append("shipping_address_collection[allowed_countries][1]", "BE");
  params.append("shipping_address_collection[allowed_countries][2]", "LU");
  params.append("shipping_address_collection[allowed_countries][3]", "CH");
  params.append("shipping_address_collection[allowed_countries][4]", "MC");

  /* Champ custom : entreprise */
  params.append("custom_fields[0][key]", "entreprise");
  params.append("custom_fields[0][label][type]", "custom");
  params.append("custom_fields[0][label][custom]", "Entreprise (optionnel)");
  params.append("custom_fields[0][type]", "text");
  params.append("custom_fields[0][optional]", "true");

  /* Téléphone */
  params.append("phone_number_collection[enabled]", "true");

  /* URLs succès/annulation */
  params.append("success_url", `${origin}/commande-confirmee?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${origin}/coffrets-semi-custom?payment=cancelled`);

  /* Metadata (info Maison B) */
  if (metadata && typeof metadata === "object") {
    for (const [k, v] of Object.entries(metadata)) {
      if (v === null || v === undefined) continue;
      const val = String(v).slice(0, 500);
      if (val) params.append(`metadata[${k}]`, val);
    }
  }
  if (customer_name) params.append("metadata[nom_complet]", String(customer_name).slice(0, 500));

  /* Appel Stripe API */
  const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!stripeResp.ok) {
    const detail = await stripeResp.text();
    console.error("Stripe error:", detail);
    return json({ error: "Paiement indisponible. Réessayez." }, 502);
  }

  const session = await stripeResp.json();
  return json({ url: session.url, id: session.id });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
