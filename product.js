
(() => {
  const els = {
    title: document.getElementById("title"),
    meta: document.getElementById("meta"),
    category: document.getElementById("category"),
    brand: document.getElementById("brand"),
    unit: document.getElementById("unit"),
    rating: document.getElementById("rating"),
    discount: document.getElementById("discount"),
    stock: document.getElementById("stock"),
    price: document.getElementById("price"),
    desc: document.getElementById("desc"),
    img: document.getElementById("img"),
    errorBox: document.getElementById("errorBox"),
    closeBtn: document.getElementById("closeBtn"),
    addBtn: document.getElementById("addBtn"),
  };

  function setError(msg) {
    if (!msg) {
      els.errorBox.style.display = "none";
      els.errorBox.textContent = "";
      return;
    }
    els.errorBox.style.display = "block";
    els.errorBox.textContent = msg;
  }

  function post(type, extra = {}) {
    try { window.parent.postMessage({ type, ...extra }, "*"); } catch { /* ignore */ }
  }

  function getId() {
    const u = new URL(window.location.href);
    return u.searchParams.get("id");
  }

  async function load() {
    setError(null);

    const id = getId();
    if (!id) {
      setError("Nema product id u URL-u. Otvori kao product.html?id=123");
      return;
    }

    const res = await Shop.fetchProducts({ force: false });
    if (!res.ok) {
      setError(res.error || "Ne mogu da učitam proizvode.");
      return;
    }

    const p = res.products.find(x => String(x.id) === String(id));
    if (!p) {
      setError("Proizvod nije pronađen.");
      return;
    }

    els.title.textContent = p.name;
    els.meta.textContent = `ID: ${p.id}`;

    els.category.textContent = p.category;
    els.brand.textContent = p.brand ? `Brend: ${p.brand}` : "Brend: —";
    els.unit.textContent = p.unit ? `Unit: ${p.unit}` : "Unit: —";

    els.rating.textContent = `Ocena: ${p.rating.toFixed(1)} / 5 (${Shop.stars(p.rating)})`;

    if (p.discountPercent > 0) {
      els.discount.style.display = "inline-block";
      els.discount.textContent = `Popust: -${p.discountPercent}%`;
    } else {
      els.discount.style.display = "none";
    }

    els.stock.textContent = p.inStock ? "Na stanju" : "Nema na stanju";
    els.stock.style.borderColor = p.inStock ? "rgba(124,255,200,.25)" : "rgba(255,106,106,.25)";
    els.stock.style.color = p.inStock ? "rgba(124,255,200,.95)" : "rgba(255,106,106,.95)";

    if (p.discountPercent > 0 && p.listPrice > p.price) {
      els.price.textContent = `${Shop.formatMoney(p.price)} (pre: ${Shop.formatMoney(p.listPrice)})`;
    } else {
      els.price.textContent = Shop.formatMoney(p.price);
    }

    els.desc.textContent = p.description || "Nema opisa.";

   if (p.image) {
  els.img.onerror = () => {
  els.img.onerror = null;
  els.img.src = `https://picsum.photos/seed/${encodeURIComponent(p.id)}/800/600`;
};

els.img.referrerPolicy = "no-referrer";
els.img.src = p.image;
els.img.alt = p.name;
} else {
  els.img.onerror = null;
  els.img.removeAttribute("src");
  els.img.alt = "";
}

    els.addBtn.disabled = !p.inStock;
    els.addBtn.onclick = () => {
      if (!p.inStock) return;
      post("addToCart", { id: p.id });
    };
  }

  els.closeBtn.addEventListener("click", () => post("closeProduct"));

  load();
})();