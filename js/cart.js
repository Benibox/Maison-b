/* Maison B — Cart drawer (shared across all pages)
   Single source of truth. Auto-injects styles + markup.
   Public API: window.MaisonBCart = { add, remove, updateQty, open, close, getItems, getCount, getTotal } */
(function() {
  'use strict';

  var STORAGE_KEY = 'maisonb_cart_v1';
  var state = { items: [] };

  // ===== STORAGE =====
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state.items = JSON.parse(raw) || [];
    } catch (e) { state.items = []; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)); } catch (e) {}
  }

  // ===== STATE OPS =====
  function findItem(slug) {
    for (var i = 0; i < state.items.length; i++) {
      if (state.items[i].slug === slug) return state.items[i];
    }
    return null;
  }
  function getCount() {
    var c = 0;
    for (var i = 0; i < state.items.length; i++) c += (state.items[i].qty || 1);
    return c;
  }
  function getTotal() {
    var t = 0;
    for (var i = 0; i < state.items.length; i++) t += state.items[i].price * (state.items[i].qty || 1);
    return t;
  }
  function add(item) {
    if (!item || !item.slug) return;
    var existing = findItem(item.slug);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      state.items.push({
        slug: String(item.slug),
        name: String(item.name || item.slug),
        price: Number(item.price) || 0,
        qty: 1,
        img: String(item.img || ''),
        config: {}
      });
    }
    save();
    render();
    pulseBadge();
  }
  function setItem(item) {
    /* Replaces (or creates) — used after tunnel config flow to persist qty + extras */
    if (!item || !item.slug) return;
    var existing = findItem(item.slug);
    if (existing) {
      existing.qty = Number(item.qty) || 1;
      existing.price = Number(item.price) || 0;
      existing.img = String(item.img || existing.img || '');
      existing.name = String(item.name || existing.name || item.slug);
      existing.config = item.config || {};
    } else {
      state.items.push({
        slug: String(item.slug),
        name: String(item.name || item.slug),
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 1,
        img: String(item.img || ''),
        config: item.config || {}
      });
    }
    save();
    render();
    pulseBadge();
  }
  function remove(slug) {
    state.items = state.items.filter(function(i) { return i.slug !== slug; });
    save();
    render();
  }
  function updateQty(slug, qty) {
    if (qty <= 0) return remove(slug);
    var it = findItem(slug);
    if (it) { it.qty = qty; save(); render(); }
  }

  // ===== STYLES =====
  function injectStyles() {
    if (document.getElementById('mb-cart-styles')) return;
    var css = '' +
      '.mb-cart-drawer{position:fixed;inset:0;z-index:1000;pointer-events:none;visibility:hidden}' +
      '.mb-cart-drawer.open{pointer-events:all;visibility:visible}' +
      '.mb-cart-backdrop{position:absolute;inset:0;background:rgba(26,26,26,.5);opacity:0;transition:opacity .4s cubic-bezier(.22,1,.36,1)}' +
      '.mb-cart-drawer.open .mb-cart-backdrop{opacity:1}' +
      '.mb-cart-panel{position:absolute;top:0;right:0;bottom:0;width:420px;max-width:100vw;background:var(--blanc,#FAFAF8);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .4s cubic-bezier(.22,1,.36,1);box-shadow:-8px 0 40px rgba(0,0,0,.12)}' +
      '.mb-cart-drawer.open .mb-cart-panel{transform:translateX(0)}' +
      '.mb-cart-header{display:flex;align-items:center;justify-content:space-between;padding:24px 32px 20px;border-bottom:1px solid rgba(140,120,81,.18);flex-shrink:0}' +
      '.mb-cart-header h2{font-family:var(--serif),"Cormorant Garamond",serif;font-size:24px;font-weight:300;margin:0;letter-spacing:.5px;color:var(--noir,#1A1A1A)}' +
      '.mb-cart-header h2 .mb-cart-count{font-family:var(--sans),"DM Sans",sans-serif;font-size:11px;font-weight:500;letter-spacing:.18em;color:var(--gris,#6B6258);margin-left:10px;vertical-align:middle}' +
      '.mb-cart-close{background:none;border:none;cursor:pointer;padding:8px;color:var(--noir,#1A1A1A);transition:opacity .3s;line-height:0}' +
      '.mb-cart-close:hover{opacity:.55}' +
      '.mb-cart-close svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.5}' +
      '.mb-cart-body{flex:1;overflow-y:auto;padding:24px 32px}' +
      '.mb-cart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:100%;padding:40px 20px}' +
      '.mb-cart-empty-icon{width:64px;height:64px;margin-bottom:28px;color:rgba(140,120,81,.45)}' +
      '.mb-cart-empty-icon svg{width:100%;height:100%;stroke:currentColor;fill:none;stroke-width:1}' +
      '.mb-cart-empty h3{font-family:var(--serif),"Cormorant Garamond",serif;font-size:26px;font-weight:300;font-style:italic;color:var(--noir,#1A1A1A);margin:0 0 12px;line-height:1.3}' +
      '.mb-cart-empty p{font-family:var(--sans),"DM Sans",sans-serif;font-size:13.5px;color:var(--gris,#6B6258);line-height:1.7;margin:0 0 32px;max-width:280px}' +
      '.mb-cart-empty-cta{display:inline-block;font-family:var(--sans),"DM Sans",sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase;font-weight:500;color:var(--noir,#1A1A1A);border-bottom:1px solid var(--noir,#1A1A1A);padding-bottom:4px;transition:color .3s,border-color .3s;text-decoration:none}' +
      '.mb-cart-empty-cta:hover{color:var(--or,#8C7851);border-color:var(--or,#8C7851)}' +
      '.mb-cart-items{list-style:none;padding:0;margin:0}' +
      '.mb-cart-item{display:flex;gap:16px;padding:20px 0;border-bottom:1px solid rgba(140,120,81,.12)}' +
      '.mb-cart-item:first-child{padding-top:0}' +
      '.mb-cart-item:last-child{border-bottom:none}' +
      '.mb-cart-item-img{flex-shrink:0;width:78px;height:78px;background:var(--beige,#F4ECE0);border-radius:4px;display:flex;align-items:center;justify-content:center;padding:8px}' +
      '.mb-cart-item-img img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}' +
      '.mb-cart-item-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;gap:10px}' +
      '.mb-cart-item-name{font-family:var(--sans),"DM Sans",sans-serif;font-size:13.5px;font-weight:500;color:var(--noir,#1A1A1A);margin:0 0 4px;line-height:1.4}' +
      '.mb-cart-item-price{font-family:var(--serif),"Cormorant Garamond",serif;font-size:17px;font-weight:400;color:var(--noir,#1A1A1A);font-variant-numeric:lining-nums}' +
      '.mb-cart-item-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px}' +
      '.mb-cart-qty{display:inline-flex;align-items:center;border:1px solid rgba(140,120,81,.28)}' +
      '.mb-cart-qty-btn{width:28px;height:28px;background:none;border:none;cursor:pointer;font-size:15px;color:var(--noir,#1A1A1A);transition:background .3s;font-family:var(--sans),sans-serif;padding:0;line-height:1}' +
      '.mb-cart-qty-btn:hover{background:rgba(140,120,81,.08)}' +
      '.mb-cart-qty-val{width:30px;text-align:center;font-family:var(--sans),"DM Sans",sans-serif;font-size:13px;font-weight:500;font-variant-numeric:lining-nums}' +
      '.mb-cart-item-remove{background:none;border:none;cursor:pointer;padding:4px 0;color:var(--gris,#6B6258);font-family:var(--sans),"DM Sans",sans-serif;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:500;transition:color .3s}' +
      '.mb-cart-item-remove:hover{color:var(--noir,#1A1A1A)}' +
      '.mb-cart-footer{padding:22px 32px 28px;border-top:1px solid rgba(140,120,81,.18);background:var(--blanc,#FAFAF8);flex-shrink:0}' +
      '.mb-cart-total{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}' +
      '.mb-cart-total-label{font-family:var(--sans),"DM Sans",sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gris,#6B6258);font-weight:500}' +
      '.mb-cart-total-val{font-family:var(--serif),"Cormorant Garamond",serif;font-size:24px;font-weight:400;color:var(--noir,#1A1A1A);font-variant-numeric:lining-nums}' +
      '.mb-cart-note{font-family:var(--sans),"DM Sans",sans-serif;font-size:11px;color:var(--gris,#6B6258);font-style:italic;margin:0 0 18px;line-height:1.5}' +
      '.mb-cart-checkout{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:16px 24px;background:var(--noir,#1A1A1A);color:var(--blanc,#FAFAF8);font-family:var(--sans),"DM Sans",sans-serif;font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:500;border:none;cursor:pointer;transition:background .3s,transform .3s}' +
      '.mb-cart-checkout:hover{background:var(--brun,#2C2821);transform:translateY(-1px)}' +
      '.nav-cart{position:relative}' +
      '.mb-cart-badge{position:absolute;top:2px;right:2px;min-width:17px;height:17px;padding:0 4px;background:var(--or,#8C7851);color:#fff;font-family:var(--sans),"DM Sans",sans-serif;font-size:10px;font-weight:600;border-radius:100px;display:none;align-items:center;justify-content:center;line-height:1;font-variant-numeric:lining-nums;pointer-events:none}' +
      '.mb-cart-badge.visible{display:flex}' +
      '.mb-cart-badge.pulse{animation:mbCartPulse .55s cubic-bezier(.22,1,.36,1)}' +
      '@keyframes mbCartPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}' +
      '@media (max-width:768px){.mb-cart-panel{width:100vw}.mb-cart-header{padding:18px 24px 16px}.mb-cart-header h2{font-size:22px}.mb-cart-body{padding:20px 24px}.mb-cart-footer{padding:18px 24px 24px}.mb-cart-empty h3{font-size:24px}.mb-cart-item-img{width:68px;height:68px}}';
    var style = document.createElement('style');
    style.id = 'mb-cart-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ===== HELPERS =====
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) if (attrs.hasOwnProperty(k)) {
        if (k === 'class') n.className = attrs[k];
        else if (k.indexOf('data-') === 0) n.setAttribute(k, attrs[k]);
        else if (k === 'aria') {
          for (var ak in attrs[k]) n.setAttribute('aria-' + ak, attrs[k][ak]);
        }
        else n.setAttribute(k, attrs[k]);
      }
    }
    if (text != null) n.textContent = String(text);
    return n;
  }

  // ===== MARKUP (static skeleton) =====
  function buildDrawer() {
    if (document.getElementById('mbCartDrawer')) return;
    var drawer = document.createElement('div');
    drawer.className = 'mb-cart-drawer';
    drawer.id = 'mbCartDrawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Votre panier');

    var backdrop = document.createElement('div');
    backdrop.className = 'mb-cart-backdrop';
    backdrop.setAttribute('data-cart-close', '');

    var aside = document.createElement('aside');
    aside.className = 'mb-cart-panel';
    aside.setAttribute('aria-modal', 'true');

    var header = document.createElement('header');
    header.className = 'mb-cart-header';
    var h2 = document.createElement('h2');
    h2.appendChild(document.createTextNode('Votre panier'));
    var countSpan = document.createElement('span');
    countSpan.className = 'mb-cart-count';
    countSpan.id = 'mbCartHeaderCount';
    h2.appendChild(countSpan);
    var closeBtn = document.createElement('button');
    closeBtn.className = 'mb-cart-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('data-cart-close', '');
    closeBtn.setAttribute('aria-label', 'Fermer');
    // Close icon SVG (static, no user data)
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    header.appendChild(h2);
    header.appendChild(closeBtn);

    var body = document.createElement('div');
    body.className = 'mb-cart-body';
    body.id = 'mbCartBody';

    var footer = document.createElement('div');
    footer.className = 'mb-cart-footer';
    footer.id = 'mbCartFooter';
    footer.style.display = 'none';

    aside.appendChild(header);
    aside.appendChild(body);
    aside.appendChild(footer);
    drawer.appendChild(backdrop);
    drawer.appendChild(aside);
    document.body.appendChild(drawer);

    drawer.addEventListener('click', function(e) {
      if (e.target.closest && e.target.closest('[data-cart-close]')) close();
    });
  }

  // ===== RENDER =====
  function buildEmptyState() {
    var wrap = el('div', { 'class': 'mb-cart-empty' });
    var iconWrap = el('div', { 'class': 'mb-cart-empty-icon' });
    iconWrap.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>';
    wrap.appendChild(iconWrap);
    wrap.appendChild(el('h3', null, 'Votre panier est vide'));
    wrap.appendChild(el('p', null, 'Découvrez nos coffrets prêts à offrir, signés par notre studio.'));
    var cta = el('a', { 'class': 'mb-cart-empty-cta', href: 'coffrets-semi-custom.html' }, 'Découvrir nos coffrets');
    wrap.appendChild(cta);
    return wrap;
  }

  function buildItemRow(it) {
    var li = el('li', { 'class': 'mb-cart-item' });

    var imgWrap = el('div', { 'class': 'mb-cart-item-img' });
    var img = document.createElement('img');
    img.src = it.img;
    img.alt = it.name;
    imgWrap.appendChild(img);
    li.appendChild(imgWrap);

    var info = el('div', { 'class': 'mb-cart-item-info' });
    var top = document.createElement('div');
    top.appendChild(el('p', { 'class': 'mb-cart-item-name' }, it.name));
    top.appendChild(el('span', { 'class': 'mb-cart-item-price' }, it.price + ' €'));
    info.appendChild(top);

    var bottom = el('div', { 'class': 'mb-cart-item-bottom' });
    var qty = el('div', { 'class': 'mb-cart-qty' });
    var dec = el('button', { type: 'button', 'class': 'mb-cart-qty-btn', 'data-qty-dec': it.slug, 'aria-label': 'Diminuer' }, '−');
    var val = el('span', { 'class': 'mb-cart-qty-val' }, it.qty);
    var inc = el('button', { type: 'button', 'class': 'mb-cart-qty-btn', 'data-qty-inc': it.slug, 'aria-label': 'Augmenter' }, '+');
    qty.appendChild(dec); qty.appendChild(val); qty.appendChild(inc);
    bottom.appendChild(qty);
    var rem = el('button', { type: 'button', 'class': 'mb-cart-item-remove', 'data-remove': it.slug }, 'Retirer');
    bottom.appendChild(rem);
    info.appendChild(bottom);
    li.appendChild(info);

    dec.addEventListener('click', function() { updateQty(it.slug, it.qty - 1); });
    inc.addEventListener('click', function() { updateQty(it.slug, it.qty + 1); });
    rem.addEventListener('click', function() { remove(it.slug); });

    return li;
  }

  function buildFooter() {
    var f = document.createDocumentFragment();
    var totalRow = el('div', { 'class': 'mb-cart-total' });
    totalRow.appendChild(el('span', { 'class': 'mb-cart-total-label' }, 'Total'));
    totalRow.appendChild(el('span', { 'class': 'mb-cart-total-val' }, getTotal() + ' €'));
    f.appendChild(totalRow);
    f.appendChild(el('p', { 'class': 'mb-cart-note' }, 'Carte manuscrite incluse · Livraison sous 4 à 5 semaines'));
    var btn = el('button', { type: 'button', 'class': 'mb-cart-checkout', id: 'mbCartCheckout' }, 'Commander →');
    btn.addEventListener('click', startCheckout);
    f.appendChild(btn);
    return f;
  }

  function clearChildren(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function render() {
    var body = document.getElementById('mbCartBody');
    var footer = document.getElementById('mbCartFooter');
    var headerCount = document.getElementById('mbCartHeaderCount');

    if (headerCount) {
      var n = getCount();
      headerCount.textContent = n > 0 ? '· ' + n + ' article' + (n > 1 ? 's' : '') : '';
    }

    if (body) {
      clearChildren(body);
      if (state.items.length === 0) {
        body.appendChild(buildEmptyState());
      } else {
        var ul = el('ul', { 'class': 'mb-cart-items' });
        for (var i = 0; i < state.items.length; i++) {
          ul.appendChild(buildItemRow(state.items[i]));
        }
        body.appendChild(ul);
      }
    }

    if (footer) {
      clearChildren(footer);
      if (state.items.length === 0) {
        footer.style.display = 'none';
      } else {
        footer.appendChild(buildFooter());
        footer.style.display = 'block';
      }
    }

    renderBadge();
  }

  function renderBadge() {
    var icons = document.querySelectorAll('.nav-cart');
    var count = getCount();
    icons.forEach(function(icon) {
      var badge = icon.querySelector('.mb-cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'mb-cart-badge';
        icon.appendChild(badge);
      }
      badge.textContent = count;
      if (count > 0) badge.classList.add('visible');
      else badge.classList.remove('visible');
    });
  }

  function pulseBadge() {
    var badges = document.querySelectorAll('.mb-cart-badge.visible');
    badges.forEach(function(b) {
      b.classList.remove('pulse');
      void b.offsetWidth; // reflow
      b.classList.add('pulse');
    });
  }

  // ===== CHECKOUT =====
  function startCheckout() {
    if (state.items.length === 0) return;
    var here = window.location.pathname;
    if (typeof window.openTunnelForCheckout === 'function') {
      close();
      setTimeout(function() { window.openTunnelForCheckout(state.items.slice()); }, 250);
      return;
    }
    /* Tunnel function lives only on coffrets-semi-custom — navigate there with intent flag */
    try { sessionStorage.setItem('mb_open_checkout', '1'); } catch (e) {}
    if (here.indexOf('coffrets-semi-custom') !== -1) {
      window.location.reload();
    } else {
      window.location.href = 'coffrets-semi-custom.html#checkout';
    }
  }

  // ===== OPEN/CLOSE =====
  function open() {
    var d = document.getElementById('mbCartDrawer');
    if (!d) return;
    render();
    d.classList.add('open');
    d.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    var d = document.getElementById('mbCartDrawer');
    if (!d) return;
    d.classList.remove('open');
    d.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ===== INIT =====
  function init() {
    load();
    injectStyles();
    buildDrawer();
    render();

    document.querySelectorAll('.nav-cart').forEach(function(icon) {
      icon.addEventListener('click', function(e) {
        e.preventDefault();
        open();
      });
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ===== PUBLIC API =====
  window.MaisonBCart = {
    add: add,
    setItem: setItem,
    remove: remove,
    updateQty: updateQty,
    open: open,
    close: close,
    getItems: function() { return state.items.slice(); },
    getCount: getCount,
    getTotal: getTotal
  };
})();
