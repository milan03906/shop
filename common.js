
(function () {
  const CART_KEY = "shop_cart_v1";
  const PRODUCTS_CACHE_KEY = "shop_products_cache_v1";
  const PRODUCTS_CACHE_TS_KEY = "shop_products_cache_ts_v1";
  const CACHE_TTL_MS = 5 * 60 * 1000;

  function cfg() {
    return window.SHOP_CONFIG || { API_URL: "", CURRENCY: "USD" };
  }

  function toNumber(x, fallback = 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
  }

function extractArray(json) {
  if (Array.isArray(json)) return json;

  
  if (json && Array.isArray(json.products)) return json.products;

  
  if (json && Array.isArray(json.data)) return json.data;
  if (json && Array.isArray(json.Data)) return json.Data;
  if (json && Array.isArray(json.items)) return json.items;

  return [];
}
function picsumUrl(id) {
  return `https://picsum.photos/seed/${encodeURIComponent(String(id))}/800/600`;
}

function isBadImageUrl(url) {
  if (!url) return true;
  try {
    const u = new URL(url);
    const badHosts = new Set([
      "placeimg.com",
      "api.lorem.space",
      "loremflickr.com",
      "loremflickr.com",
      "via.placeholder.com",
    ]);
    return badHosts.has(u.hostname);
  } catch {
    return true;
  }
}

function pickSafeImage(p, id) {
  const imgs = Array.isArray(p?.images) ? p.images : [];
  const candidates = [
    ...imgs,
    p?.image,
    p?.thumbnail
  ].filter(Boolean).map(x => String(x).trim());

  for (const c of candidates) {
    if (!isBadImageUrl(c)) return c;
  }
  return picsumUrl(id);
}

  
  function normalizeProduct(p, idx) {
  const id = p?.id ?? p?._id ?? p?.product_id ?? `p_${idx}`;

  const name = (p?.title ?? p?.name ?? "Bez naziva").toString();
  const description = (p?.description ?? "").toString();

  const category =
  (typeof p?.category === "string")
    ? p.category
    : (p?.category?.name ?? p?.category?.title ?? "Ostalo");
  const brand = (p?.brand ?? p?.manufacturer ?? p?.brandName ?? "").toString();

  let image =
    p?.thumbnail ??
    (Array.isArray(p?.images) ? p.images[0] : null) ??
    p?.image ??
    "";

  image = typeof image === "string" ? image.trim() : "";
  if (!image) image = `https://picsum.photos/seed/${encodeURIComponent(String(id))}/800/600`;

  
  let rating = toNumber(p?.rating, 0);
  rating = Math.max(0, Math.min(5, rating));

  const stockCount = toNumber(p?.stock, 0);
  const inStock = stockCount > 0;

  
  const listPrice = toNumber(p?.price, 0);
  const discountPercent = Math.max(0, Math.min(100, toNumber(p?.discountPercentage, 0)));

  
  const priceRaw = listPrice * (1 - discountPercent / 100);
  const price = Math.round(priceRaw * 100) / 100;

  return {
    id: String(id),
    name,
    description,
    category: String(category),
    brand,
    unit: "",

    image,
    rating,

    inStock,
    stockCount,

    price,                 
    listPrice,             
    discountPercent: Math.round(discountPercent)
  };
}

  function formatMoney(n) {
    const val = toNumber(n, 0);
    const currency = cfg().CURRENCY || "USD";
    return new Intl.NumberFormat("sr-RS", { style: "currency", currency }).format(val);
  }

  function stars(r) {
    const full = Math.floor(r);
    const half = (r - full) >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

   async function fetchProducts({ force = false } = {}) {
  const { API_URL } = cfg();
  if (!API_URL) return { ok: false, error: "Nema API_URL", products: [] };

  const base = String(API_URL).replace(/\/+$/, "");

  
  try {
    const ts = toNumber(localStorage.getItem(PRODUCTS_CACHE_TS_KEY), 0);
    const cachedRaw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!force && cachedRaw && ts && (Date.now() - ts) < CACHE_TTL_MS) {
      const cached = JSON.parse(cachedRaw);
      if (Array.isArray(cached)) return { ok: true, products: cached };
    }
  } catch {}

  const limit = 100;        
  const maxPages = 20;      

  const all = [];
  const seen = new Set();

  try {
    for (let page = 0; page < maxPages; page++) {
      const skip = page * limit;
      const url = `${base}?limit=${limit}&skip=${skip}`;

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`API greška: ${res.status} ${res.statusText}`);

      const json = await res.json();
      const arr = extractArray(json);
      if (!Array.isArray(arr) || arr.length === 0) break;

      for (let i = 0; i < arr.length; i++) {
        const p = normalizeProduct(arr[i], i);
        if (!seen.has(p.id)) {
          seen.add(p.id);
          all.push(p);
        }
      }

      
      const total = toNumber(json?.total, 0);
      if (total && all.length >= total) break;

      if (arr.length < limit) break;
    }

    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(all));
    localStorage.setItem(PRODUCTS_CACHE_TS_KEY, String(Date.now()));

    return { ok: true, products: all };
  } catch (e) {
    return { ok: false, error: String(e?.message || e), products: [] };
  }
}

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function cartItems(cart = loadCart()) {
    return Object.values(cart || {});
  }

  function cartCount(cart = loadCart()) {
    return cartItems(cart).reduce((sum, it) => sum + toNumber(it.qty, 0), 0);
  }

  function cartSubtotal(cart = loadCart()) {
    return cartItems(cart).reduce((sum, it) => {
      const price = toNumber(it.product?.price, 0);
      const qty = toNumber(it.qty, 0);
      return sum + price * qty;
    }, 0);
  }

  function addToCart(product, qty = 1) {
    const cart = loadCart();
    const id = String(product.id);
    const existing = cart[id];
    const newQty = toNumber(existing?.qty, 0) + toNumber(qty, 1);
    cart[id] = { product, qty: newQty };
    saveCart(cart);
    return cart;
  }

  function setQty(productId, qty) {
    const cart = loadCart();
    const id = String(productId);
    const q = toNumber(qty, 0);
    if (!cart[id]) return cart;
    if (q <= 0) delete cart[id];
    else cart[id].qty = q;
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    saveCart({});
    return {};
  }

  window.Shop = {
    cfg,
    toNumber,
    extractArray,
    normalizeProduct,
    formatMoney,
    stars,
    escapeHtml,
    fetchProducts,
    loadCart,
    saveCart,
    cartItems,
    cartCount,
    cartSubtotal,
    addToCart,
    setQty,
    clearCart
  };
})();