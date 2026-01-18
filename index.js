(() => {
  const els = {
    apiStatus: document.getElementById("apiStatus"),
    cartPill: document.getElementById("cartPill"),

    q: document.getElementById("q"),
    category: document.getElementById("category"),
    brand: document.getElementById("brand"),
    minPrice: document.getElementById("minPrice"),
    maxPrice: document.getElementById("maxPrice"),
    minRating: document.getElementById("minRating"),
    inStock: document.getElementById("inStock"),
    sort: document.getElementById("sort"),
    perPage: document.getElementById("perPage"),
    resetBtn: document.getElementById("resetBtn"),
    reloadBtn: document.getElementById("reloadBtn"),

    products: document.getElementById("products"),
    errorBox: document.getElementById("errorBox"),
    resultsMeta: document.getElementById("resultsMeta"),
    pageMeta: document.getElementById("pageMeta"),
    bottomMeta: document.getElementById("bottomMeta"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    prevBtn2: document.getElementById("prevBtn2"),
    nextBtn2: document.getElementById("nextBtn2"),

    openCartBtn: document.getElementById("openCartBtn"),

    cartDialog: document.getElementById("cartDialog"),
    cartFrame: document.getElementById("cartFrame"),
    closeCart: document.getElementById("closeCart"),

    productDialog: document.getElementById("productDialog"),
    productFrame: document.getElementById("productFrame"),
    closeProduct: document.getElementById("closeProduct"),

    checkoutDialog: document.getElementById("checkoutDialog"),
    checkoutFrame: document.getElementById("checkoutFrame"),
    closeCheckout: document.getElementById("closeCheckout"),
  };

  const parsePerPage = () => {
    const pp = Number(els.perPage.value);
    return Number.isFinite(pp) ? pp : 9;
  };

  const state = {
    all: [],
    filtered: [],
    page: 1,
    perPage: parsePerPage(),
  };

  function prettyCategory(v) {
    return String(v || "")
      .replaceAll("-", " ")
      .replaceAll("_", " ")
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }
  function categoryValue(cat) {
  if (!cat) return "other";
  if (typeof cat === "string") return cat.trim() || "other";

  if (typeof cat === "object") {
    const v = cat.slug ?? cat.name ?? cat.title ?? cat.id;
    return v != null ? String(v).trim() : "other";
  }

  return "other";
}

function categoryLabel(cat) {
  const v = categoryValue(cat);
  return prettyCategory(v);
}

  function setError(msg) {
    if (!msg) {
      els.errorBox.style.display = "none";
      els.errorBox.textContent = "";
      return;
    }
    els.errorBox.style.display = "block";
    els.errorBox.textContent = msg;
  }

  function updateCartPill() {
    els.cartPill.textContent = `Cart: ${Shop.cartCount()}`;
  }

  function rebuildCategories() {
    const cats = Array.from(
  new Set(state.all.map(p => categoryValue(p.category)))
)
  .filter(c => typeof c === "string" && c && c !== "[object Object]")
  .sort((a, b) => a.localeCompare(b));

    const current = els.category.value || "__all__";
    els.category.innerHTML =
      `<option value="__all__">Sve</option>` +
      cats.map(c => `<option value="${Shop.escapeHtml(c)}">${Shop.escapeHtml(categoryLabel(c))}</option>`)

    els.category.value = cats.includes(current) ? current : "__all__";
  }

  function rebuildBrands() {
    if (!els.brand) return;

    const brands = Array.from(
      new Set(state.all.map(p => (p.brand || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const current = els.brand.value || "__all__";

    els.brand.innerHTML =
      `<option value="__all__">Sve</option>` +
      brands.map(b => `<option value="${Shop.escapeHtml(b)}">${Shop.escapeHtml(b)}</option>`).join("");

    els.brand.value = brands.includes(current) ? current : "__all__";
  }

  function applyFilters() {
    const q = (els.q.value || "").trim().toLowerCase();
    const category = els.category.value;
    const brand = els.brand ? els.brand.value : "__all__";
    const minPrice = els.minPrice.value === "" ? null : Shop.toNumber(els.minPrice.value, 0);
    const maxPrice = els.maxPrice.value === "" ? null : Shop.toNumber(els.maxPrice.value, 0);
    const minRating = Shop.toNumber(els.minRating.value, 0);
    const inStockSel = els.inStock.value;
    const sort = els.sort.value;

    let list = state.all.slice();

    if (q) {
      list = list.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q)
      );
    }

    if (category !== "__all__") list = list.filter(p => categoryValue(p.category) === category);
    if (brand !== "__all__") list = list.filter(p => (p.brand || "") === brand);

    if (minPrice != null) list = list.filter(p => Shop.toNumber(p.price, 0) >= minPrice);
    if (maxPrice != null) list = list.filter(p => Shop.toNumber(p.price, 0) <= maxPrice);

    if (minRating > 0) list = list.filter(p => Shop.toNumber(p.rating, 0) >= minRating);

    if (inStockSel === "true") list = list.filter(p => p.inStock === true);
    if (inStockSel === "false") list = list.filter(p => p.inStock === false);

    if (sort === "price_asc") list.sort((a, b) => Shop.toNumber(a.price, 0) - Shop.toNumber(b.price, 0));
    else if (sort === "price_desc") list.sort((a, b) => Shop.toNumber(b.price, 0) - Shop.toNumber(a.price, 0));
    else if (sort === "name_asc") list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    else if (sort === "rating_desc") list.sort((a, b) => Shop.toNumber(b.rating, 0) - Shop.toNumber(a.rating, 0));

    state.filtered = list;
  }

  function paginate(list) {
    let perPage = state.perPage;
    const total = list.length;

    if (perPage <= 0) perPage = total || 1;

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    state.page = Math.min(Math.max(1, state.page), totalPages);

    const start = (state.page - 1) * perPage;
    return { items: list.slice(start, start + perPage), total, totalPages };
  }

  function render() {
    applyFilters();
    const { items, total, totalPages } = paginate(state.filtered);

    els.resultsMeta.textContent = `Ukupno: ${total}`;
    els.pageMeta.textContent = `Stranica ${state.page} od ${totalPages}`;
    els.bottomMeta.textContent = `Stranica ${state.page} od ${totalPages} • Ukupno: ${total}`;

    const prevDisabled = state.page <= 1;
    const nextDisabled = state.page >= totalPages;
    [els.prevBtn, els.prevBtn2].forEach(b => b.disabled = prevDisabled);
    [els.nextBtn, els.nextBtn2].forEach(b => b.disabled = nextDisabled);

    if (items.length === 0) {
      els.products.innerHTML = `<div class="error" style="grid-column:1/-1">Nema proizvoda za izabrane filtere.</div>`;
      return;
    }

    els.products.innerHTML = items.map(p => {
      const img = `<img
  src="${Shop.escapeHtml(p.image)}"
  alt="${Shop.escapeHtml(p.name)}"
  loading="lazy"
  referrerpolicy="no-referrer"
  onerror="this.onerror=null;this.src='https://picsum.photos/seed/${encodeURIComponent(p.id)}/800/600';"
/>`;

      const stockClass = p.inStock ? "ok" : "no";
      const stockText = p.inStock ? "Na stanju" : "Nema";

      const priceHtml =
        (p.discountPercent > 0 && p.listPrice > p.price)
          ? `<div class="price-wrap">
               <div class="price">${Shop.escapeHtml(Shop.formatMoney(p.price))}</div>
               <div class="old-price">${Shop.escapeHtml(Shop.formatMoney(p.listPrice))}</div>
               <div class="disc">-${Shop.escapeHtml(p.discountPercent)}%</div>
             </div>`
          : `<div class="price">${Shop.escapeHtml(Shop.formatMoney(p.price))}</div>`;

      return `
        <article class="card">
          <div class="thumb">
            ${img}
            <div class="badge">${Shop.escapeHtml(categoryLabel(p.category))}</div>
          </div>
          <div class="body">
            <h3 class="title">
              <button type="button" data-open="${Shop.escapeHtml(p.id)}">${Shop.escapeHtml(p.name)}</button>
            </h3>

            <div class="sub">
              <div title="Ocena">${Shop.escapeHtml(Shop.stars(p.rating))} (${p.rating.toFixed(1)})</div>
              <div class="mini" title="Brend">${Shop.escapeHtml(p.brand || "")}</div>
              <div class="stock ${stockClass}">${stockText}</div>
            </div>

            <div class="actions">
              ${priceHtml}
              <button class="btn small add" type="button" data-add="${Shop.escapeHtml(p.id)}" ${p.inStock ? "" : "disabled"}>
                Add to cart
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function openCart() {
    els.cartDialog.showModal();
    try { els.cartFrame.contentWindow.location.reload(); } catch {}
  }

  function openProduct(id) {
    els.productFrame.src = `product.html?id=${encodeURIComponent(id)}`;
    els.productDialog.showModal();
  }

  function openCheckout() {
    els.checkoutFrame.src = `checkout.html`;
    els.checkoutDialog.showModal();
    try { els.checkoutFrame.contentWindow.location.reload(); } catch {}
  }

  async function loadProducts(force = false) {
    setError(null);
    els.apiStatus.textContent = "Učitavanje…";

    const res = await Shop.fetchProducts({ force });

    if (!res.ok) {
      els.apiStatus.textContent = "Greška";
      setError(res.error || "Greška pri učitavanju API-ja");
      state.all = [];
      if (els.category.options.length <= 1) rebuildCategories();
      rebuildBrands();
      render();
      updateCartPill();
      return;
    }

    state.all = res.products;
    els.apiStatus.textContent = `Učitano: ${state.all.length}`;

    if (els.category.options.length <= 1) rebuildCategories();
    rebuildBrands();

    state.page = 1;
    state.perPage = parsePerPage();
    render();
    updateCartPill();
  }

  async function loadCategoriesFromApi() {
    const current = els.category.value || "__all__";
    els.category.innerHTML = `<option value="__all__">Sve</option>`;

    try {
      const res = await fetch("https://dummyjson.com/products/categories", {
        headers: { Accept: "application/json" }
      });
      if (!res.ok) throw new Error(`Categories API: ${res.status}`);

      const cats = await res.json();
      if (Array.isArray(cats)) {
  els.category.innerHTML += cats.map(c => {
    const value = categoryValue(c);       
    const label = categoryLabel(c);       
    return `<option value="${Shop.escapeHtml(value)}">${Shop.escapeHtml(label)}</option>`;
  }).join("");
}
    } catch (e) {
      console.warn(e);
    }

    els.category.value = current;
  }

  els.products.addEventListener("click", (e) => {
    const openBtn = e.target.closest("button[data-open]");
    const addBtn = e.target.closest("button[data-add]");

    if (openBtn) {
      openProduct(openBtn.getAttribute("data-open"));
      return;
    }

    if (addBtn) {
      const id = addBtn.getAttribute("data-add");
      const product = state.all.find(x => x.id === id);
      if (!product || !product.inStock) return;

      Shop.addToCart(product, 1);
      updateCartPill();
      openCart();
    }
  });

  [els.prevBtn, els.prevBtn2].forEach(b => b.addEventListener("click", () => { state.page -= 1; render(); }));
  [els.nextBtn, els.nextBtn2].forEach(b => b.addEventListener("click", () => { state.page += 1; render(); }));

  els.openCartBtn.addEventListener("click", openCart);
  els.closeCart.addEventListener("click", () => els.cartDialog.close());
  els.closeProduct.addEventListener("click", () => els.productDialog.close());
  els.closeCheckout.addEventListener("click", () => els.checkoutDialog.close());

  const filterInputs = [
    els.q,
    els.category,
    els.brand,
    els.minPrice,
    els.maxPrice,
    els.minRating,
    els.inStock,
    els.sort,
    els.perPage
  ].filter(Boolean);

  filterInputs.forEach(el => el.addEventListener("input", () => {
    state.page = 1;
    state.perPage = parsePerPage();
    render();
  }));

  [els.category, els.brand, els.inStock, els.sort, els.perPage].filter(Boolean).forEach(el => el.addEventListener("change", () => {
    state.page = 1;
    state.perPage = parsePerPage();
    render();
  }));

  els.resetBtn.addEventListener("click", () => {
    els.q.value = "";
    els.category.value = "__all__";
    if (els.brand) els.brand.value = "__all__";
    els.minPrice.value = "";
    els.maxPrice.value = "";
    els.minRating.value = "3";
    els.inStock.value = "__any__";
    els.sort.value = "relevance";
    els.perPage.value = "9";
    state.page = 1;
    state.perPage = 9;
    render();
  });

  els.reloadBtn.addEventListener("click", () => loadProducts(true));

  window.addEventListener("message", (event) => {
    const data = event.data || {};
    if (typeof data !== "object") return;

    if (data.type === "closeCart") els.cartDialog.close();
    if (data.type === "closeProduct") els.productDialog.close();
    if (data.type === "closeCheckout") els.checkoutDialog.close();

    if (data.type === "openCheckout") openCheckout();
    if (data.type === "openProduct" && data.id) openProduct(String(data.id));

    if (data.type === "addToCart" && data.id) {
      const p = state.all.find(x => x.id === String(data.id));
      if (p && p.inStock) {
        Shop.addToCart(p, 1);
        updateCartPill();
        openCart();
      }
    }

    if (data.type === "cartUpdated") updateCartPill();

    if (data.type === "checkoutComplete") {
      updateCartPill();
      els.checkoutDialog.close();
      els.cartDialog.close();
    }
  });

  updateCartPill();
  loadCategoriesFromApi();
  loadProducts(false);
})();