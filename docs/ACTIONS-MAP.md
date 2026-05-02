# Maison B — Action Map du site

> Cartographie complète : chaque page, chaque CTA, chaque destination, chaque flow interactif.
>
> Live : <https://site-maison-b-v2.ethanbenamram99.workers.dev>
> Date : 2026-05-02 · Build `5695617`

---

## 🗺️ Architecture globale

```
                              ┌───────────────────────────┐
                              │       index.html          │
                              │   (page d'accueil)        │
                              └──────────┬────────────────┘
                                         │
        ┌────────────┬───────────────────┼──────────────────┬────────────┐
        │            │                   │                  │            │
        ▼            ▼                   ▼                  ▼            ▼
 a-propos.html  contact.html  coffrets-semi-custom.html  entreprises.html  mentions
                                       │
                                       │ click coffret
                                       ▼
                              ┌────────────────────┐
                              │  Product Overlay   │ ← state interne
                              │ (fiche détaillée)  │
                              └─────────┬──────────┘
                                        │
                       ┌────────────────┴──────────────────┐
                       │                                   │
                       ▼                                   ▼
            « Ajouter au panier »                « Commander direct »
                       │                                   │
                       ▼                                   ▼
              Tunnel mode addToCart                Tunnel mode full
              (étapes 1+2)                         (étapes 1→2→3)
                       │                                   │
                       ▼                                   │
                 Cart Drawer ← ← ← « Commander »           │
                       │             (mode checkout, étape 3 seule)
                       ▼                                   │
                       └──────────────┬────────────────────┘
                                      ▼
                          /api/create-checkout-session
                                      │
                                      ▼
                              Stripe Checkout
                                      │
                                      ▼
                          commande-confirmee.html
```

---

## 🔝 Composants globaux (présents sur toutes les pages)

### Navigation top (toutes les pages sauf `commande-confirmee`)

| Élément | Position | Action | Destination |
|---|---|---|---|
| Logo « MAISON B » | Top-left | Click | `index.html` |
| « NOS COFFRETS » | Nav center | Click | `coffrets-semi-custom.html` |
| « NOTRE HISTOIRE » | Nav center | Click | `a-propos.html` |
| « CONTACT » | Nav center | Click | `contact.html` |
| 🛒 Icône panier | Top-right | Click | Ouvre **Cart Drawer** (état vide ou rempli) |
| ☰ Burger (mobile only) | Top-right | Click | Ouvre/ferme menu mobile fullscreen |

> ⚠️ Manque : le lien vers `coffrets-personnalises-entreprises.html` n'est PAS dans la nav. Accessible uniquement via les CTAs internes (info-banner, footer, hero).

### Footer (toutes les pages)

| Section | Lien | Destination |
|---|---|---|
| Nos coffrets → Catalogue | Click | `coffrets-semi-custom.html` |
| Nos coffrets → Sur mesure | Click | `coffrets-personnalises-entreprises.html` |
| Explorer → Notre histoire | Click | `a-propos.html` |
| Explorer → Contact | Click | `contact.html` |
| Contact → email | Click | `mailto:contact@maisonb.fr` |
| Contact → tel | Click | `tel:+33100000000` |
| Newsletter form | Submit | (placeholder, pas d'action backend) |
| Bandeau cookies « Accepter » | Click | `acceptCookies()` → masque le banner + `localStorage.cookiesAccepted=1` |
| Lien « Cookies » | Click | `mentions-legales.html#cookies` |

### Cart Drawer (universel — `js/cart.js`)

Présent sur **les 7 pages**. State persisté dans `localStorage["maisonb_cart_v1"]`.

**État vide :**

![Cart vide](screens/10-cart-empty-desktop.png)

| Élément | Action |
|---|---|
| ✕ (close) ou clic backdrop ou ESC | Ferme le drawer |
| « Découvrir nos coffrets » | Navigation → `coffrets-semi-custom.html` |

**État rempli :**

![Cart rempli](screens/15-cart-filled-desktop.png)

| Élément | Action |
|---|---|
| − / + sur item | `MaisonBCart.updateQty(slug, qty)` |
| « Retirer » | `MaisonBCart.remove(slug)` |
| « Commander → » | `startCheckout()` → si page `coffrets-semi-custom` : ouvre tunnel **mode checkout** sur étape 3 avec données pré-remplies du 1er item ; sinon : flag `sessionStorage.mb_open_checkout=1` + redirige vers `coffrets-semi-custom.html` qui auto-ouvre |

---

## 1. `index.html` — Page d'accueil

![Home desktop](screens/01-home-desktop.png)

### Hero carousel (4 slides en rotation auto)

| Slide | Image | Titre | CTA | Destination |
|---|---|---|---|---|
| 0 | `hero-bandeau-floral.jpeg` | « Qui sommes-nous & ce que nous proposons » | « Découvrir notre histoire → » | `a-propos.html` |
| 1 | `IMG_7B487668FEB7-1.jpeg` | « Des cadeaux que vos collaborateurs garderont » | « Découvrir nos coffrets → » | `coffrets-semi-custom.html` |
| 2 | `IMG_9E75D411269E-1.jpeg` | « Découvrez nos coffrets personnalisables à votre image » | « Personnaliser un coffret → » | `coffrets-personnalises-entreprises.html` |
| 3 | `IMG_6112A3E81A11-1.jpeg` | « Ils nous ont fait confiance » | « Voir nos réalisations → » | `#inspirations` (anchor sur même page) |

**Contrôles carousel** : `prevSlide()` / `nextSlide()` / `goToSlide(i)` (via dots).

### Section « Nos coffrets signatures » (4 cards PNG détourées)

| Card | Image | Hover/Click | Destination |
|---|---|---|---|
| Wellness & Bien-être | `coffret-signature-floral.png` | Click | `coffrets-semi-custom.html#wellness` (auto-ouvre product overlay) |
| Gastronomie Française | `coffret-signature-estoublon.png` | Click | `coffrets-semi-custom.html#gastronomie` |
| Bureau & Lifestyle | `coffret-signature-douceurs.png` | Click | `coffrets-semi-custom.html#bureau` |
| Luxe & Prestige | `coffret-signature-shabbat.png` | Click | `coffrets-semi-custom.html#luxe` |

CTA bottom : « Voir tous nos coffrets → » → `coffrets-semi-custom.html`

### Section « Showcase » (réalisations clients — `id="inspirations"`)

| Élément | Action |
|---|---|
| « ← / → » (scrollShowcase) | `scrollShowcase(±1)` — scroll horizontal à l'intérieur du conteneur |
| Lightbox (clic sur image) | Ouvre vue plein écran ; bouton ✕ → `closeLightbox()` |

### Section « Sur-mesure » (CTA bandeau)

CTA : « Demander un devis → » → `coffrets-personnalises-entreprises.html#devis`

---

## 2. `coffrets-semi-custom.html` — Catalogue 8 coffrets

![Semi-custom desktop](screens/02-semi-custom-desktop.png)

### Hero
- Image background : `coffret-haddad-hero.jpeg` (filter `brightness(1.08)`)
- Carte translucide centrée : titre « Nos coffrets prêts à personnaliser »
- CTA « Demander un devis → » → ancre `#devis`

### Info-banner « Besoin de plus de 30 coffrets ? »
- Lien « Découvrir le sur-mesure → » → `coffrets-personnalises-entreprises.html`

### Grille 8 coffrets

Chaque card → click → `openCoffret('<slug>')` ouvre le **Product Overlay** (state interne)

| # | Slug | Nom | Prix | PNG affiché |
|---|---|---|---|---|
| 1 | `wellness` | Coffret Wellness & Bien-être | 135 € | floral |
| 2 | `gastronomie` | Coffret Gastronomie Française | 120 € | estoublon |
| 3 | `bureau` | Coffret Bureau & Lifestyle | 95 € | douceurs |
| 4 | `voyage` | Coffret Découverte & Voyage | 125 € | floral |
| 5 | `maison` | Coffret Maison & Déco | 110 € | shabbat |
| 6 | `sport` | Coffret Sport & Vitalité | 105 € | douceurs |
| 7 | `culture` | Coffret Culture & Créativité | 115 € | estoublon |
| 8 | `luxe` | Coffret Luxe & Prestige | 155 € | shabbat |

### Section « Inclus dans chaque coffret »
Carte manuscrite · Packaging personnalisé · Livraison clé en main · Restrictions respectées (info-block, pas de CTA)

### CTA Banner bas
« Découvrir le full custom → » → `coffrets-personnalises-entreprises.html`

---

## 2bis. Product Overlay (state interne — déclenché par `openCoffret(slug)`)

![Product overlay](screens/11-product-overlay-desktop.png)

| Élément | Action |
|---|---|
| ← (back) ou ✕ | `closeProduct()` |
| Thumbnails 4 photos | `switchProductImg(src, thumbEl)` — change l'image principale |
| **« Ajouter au panier »** (CTA principal) | `addCurrentToCart()` → ferme overlay + ouvre **Tunnel mode addToCart** (étapes 1+2) |
| **« Commander directement → »** (lien secondaire) | `startOrder()` → ferme overlay + ouvre **Tunnel mode full** (étapes 1→2→3) |
| Sticky CTA mobile « Ajouter au panier » | idem `addCurrentToCart()` |

---

## 2ter. Tunnel de commande (overlay modal — 3 modes)

Le tunnel est partagé entre 3 modes d'ouverture :

| Mode | Étapes visibles | Bouton final | Action finale |
|---|---|---|---|
| `addToCart` | 1 → 2 | « Ajouter au panier → » | `addItemFromTunnel()` → `MaisonBCart.setItem()` + ouvre cart drawer |
| `full` | 1 → 2 → 3 | « Payer X € par carte → » | `submitTunnel()` → POST `/api/create-checkout-session` → Stripe |
| `checkout` | 3 seul (pré-rempli depuis cart) | « Payer X € par carte → » | idem `submitTunnel()` |

### Étape 1 — Quantité

![Tunnel step 1](screens/12-tunnel-step1-desktop.png)

| Élément | Action |
|---|---|
| « − / + » | `changeQty(-1)` / `changeQty(1)` |
| Input qty | `updateQty()` (recalcule sous-total) |
| Checkbox « Stickers personnalisés (+10€) » | `updateQty()` |
| Lien « Demandez un devis personnalisé » | `coffrets-personnalises-entreprises.html` |
| « Continuer → » | `tunnelNext()` → étape 2 |

### Étape 2 — Personnalisation

![Tunnel step 2](screens/13-tunnel-step2-desktop.png)

| Élément | Action |
|---|---|
| Upload logo (PNG/JPG/SVG/PDF, 5 Mo max) | `handleLogoUpload(input)` |
| Textarea « Message carte manuscrite » | (libre, 500 char max stockés) |
| Input « Date souhaitée » | (texte libre) |
| Select « Occasion » | options : fin_annee, onboarding, clients_vip, evenement, autre |
| « ← Retour » | `tunnelPrev()` → étape 1 |
| « Continuer → » (mode `full`) ou **« Ajouter au panier → »** (mode `addToCart`) | `tunnelNext()` |

### Étape 3 — Récapitulatif & Paiement

![Tunnel step 3](screens/14-tunnel-step3-desktop.png)

| Élément | Action |
|---|---|
| Récap (coffret · qty · prix unit · total) | Lecture seule, mis à jour par `updateRecap()` |
| Input « Votre nom » (required) | (validation step) |
| Input « Email » (required) | (validation step) |
| « ← Retour » | `tunnelPrev()` → étape 2 (sauf mode `checkout` où Retour est désactivé) |
| **« Payer X € par carte → »** | `submitTunnel()` |

### `submitTunnel()` flow (étape 3 → backend)

1. POST parallèle vers **Formspree** (`https://formspree.io/f/mojpyaqw`) avec FormData complet (pour archive Maison B + upload logo)
2. POST vers **`/api/create-checkout-session`** (Cloudflare Function, `functions/api/create-checkout-session.js`)
   - Body : `{ coffret, price_unit, quantity, customer_email, customer_name, metadata }`
   - Backend → Stripe Checkout Sessions API → renvoie `{ url }`
3. `window.location.href = url` (redirection Stripe Checkout hosted)
4. Après paiement → success `success_url` = `/commande-confirmee?session_id={CHECKOUT_SESSION_ID}`

> ⚠️ **Backend mono-item** : `line_items[0]` est hardcodé. Cart multi-coffrets distincts → seul le 1er est envoyé. Min qty = 5 côté backend.

---

## 3. `coffrets-personnalises-entreprises.html` — 100% sur-mesure

![Entreprises desktop](screens/03-entreprises-desktop.png)

### Hero
- Mix éditorial 4 coffrets PNG en rangée (douceurs · estoublon · shabbat · floral)
- Eyebrow « Personnalisation complète », titre « Votre coffret 100% à votre image »
- CTA principal « Demander un devis → » → `openModal()` (modal devis form)

### Sections explicatives
- Comparaison « Nos coffrets » vs « Sur-mesure »
- Méthode en 4 étapes (process)

### CTA bottom
« Demander un devis → » → `openModal()`

---

## 3bis. Modal devis entreprises (state interne)

![Modal devis](screens/16-devis-modal-desktop.png)

| Élément | Action |
|---|---|
| ✕ (close) | `closeModal()` |
| Form fields (nom, entreprise, email, tel, qty, occasion, budget, message, contraintes) | Validation client puis submit |
| Submit → form action `https://formspree.io/f/xqegwzkk` | Envoie le brief à l'équipe Maison B |
| Lien « réserver un appel » (si présent dans body) | `https://calendar.app.google/hcjWAdWfo1weWcTW8` (Google Calendar booking) |

---

## 4. `a-propos.html` — Notre histoire

![A propos desktop](screens/04-apropos-desktop.png)

Page éditoriale, principalement du contenu narratif. CTAs minimaux :
- Nav globale (top + footer) uniquement
- Pas de form ni d'action interactive

---

## 5. `contact.html`

![Contact desktop](screens/05-contact-desktop.png)

| Élément | Action |
|---|---|
| Form contact (nom, email, message, etc.) | Submit → `https://formspree.io/f/xzdkypbe` |
| Email contact | `mailto:contact@maisonb.fr` |
| Téléphone | `tel:+33100000000` |

---

## 6. `mentions-legales.html`

![Mentions legales desktop](screens/06-mentions-desktop.png)

Page statique. Aucun CTA hors nav globale + section anchor `#cookies` linkée depuis le footer.

---

## 7. `commande-confirmee.html`

![Commande confirmee desktop](screens/07-confirmee-desktop.png)

Page de retour Stripe (post-paiement). Reçoit `?session_id=cs_xxx`.

| Élément | Action |
|---|---|
| Lien « Retour à l'accueil » | `/` (root → `index.html`) |
| (pas de cart drawer trigger ici, page « lonely page ») | — |

---

## 🌐 Récap des intégrations externes

| Intégration | Endpoint / URL | Usage |
|---|---|---|
| **Stripe Checkout** | `/api/create-checkout-session` (Cloudflare Function) → `https://api.stripe.com/v1/checkout/sessions` | Paiement coffrets |
| **Formspree** (3 forms) | `mojpyaqw` (tunnel order brief) | Archive briefs commande Maison B |
| | `xqegwzkk` (modal devis entreprises) | Demandes 100% custom |
| | `xzdkypbe` (page contact) | Form contact |
| **Google Calendar** | `https://calendar.app.google/hcjWAdWfo1weWcTW8` | Booking RDV studio |
| **Google Fonts** | `Cormorant Garamond` + `DM Sans` | Typo |
| **Cloudflare Workers** | `_worker.js` + `functions/api/*` | Hosting + API |

---

## 🧠 State management côté client (localStorage / sessionStorage)

| Clé | Valeur | Effet |
|---|---|---|
| `localStorage.maisonb_cart_v1` | `[{slug, name, price, qty, img, config}]` | Panier persistant cross-pages |
| `localStorage.cookiesAccepted` | `'1'` | Masque le bandeau cookies |
| `sessionStorage.mb_open_checkout` | `'1'` | Flag posé par cart drawer « Commander » lorsque l'user n'est pas sur semi-custom → la page semi-custom auto-ouvre le tunnel checkout au load |

---

## 📱 Mobile (différences clés vs desktop)

![Home mobile](screens/01-home-mobile.png)

- Nav links cachées → remplacés par burger ☰ (`toggleMenu()` ouvre overlay fullscreen)
- Hero carousel : image plein écran 100dvh, carte texte centrée
- Grille coffrets : 1 colonne (au lieu de 4)
- Cart drawer : prend 100vw (vs 420px desktop)
- Sticky CTA mobile sur product overlay : « Ajouter au panier » fixe en bas

---

## 🔧 Trous & TBD

1. **Backend Stripe mono-item** — refactor `_worker.js` pour `line_items[]` array → multi-coffret checkout
2. **Min qty backend = 5** — désaligné avec le min `1` du tunnel UI (validation step1)
3. **Pas de lien nav vers Sur-mesure** — `coffrets-personnalises-entreprises.html` accessible uniquement via CTAs internes
4. **Items du cart : `<input type="file" logo>` non persisté** — localStorage ne stocke pas les fichiers ; à chaque checkout faut re-uploader
5. **Newsletter footer** — submit handler `return false`, pas de backend branché
