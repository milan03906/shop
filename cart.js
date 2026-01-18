(() => {
  const els = {
    meta: document.getElementById("meta"),
    list: document.getElementById("list"),
    subtotal: document.getElementById("subtotal"),
    closeBtn: document.getElementById("closeBtn"),
    clearBtn: document.getElementById("clearBtn"),
    checkoutBtn: document.getElementById("checkoutBtn"),
  };

  function post(type, extra = {}) {
    try { window.parent.postMessage({ type, ...extra }, "*"); } catch { }
  }

  function render() {
    const cart = Shop.loadCart();
    const items = Shop.cartItems(cart);

    els.meta.textContent = `Stavke: ${items.length} • Qty: ${Shop.cartCount(cart)}`;
    els.subtotal.textContent = Shop.formatMoney(Shop.cartSubtotal(cart));
    els.checkoutBtn.disabled = items.length === 0;

    if (items.length === 0) {
      els.list.innerHTML = `<div class="empty">Korpa je prazna.</div>`;
      return;
    }

    els.list.innerHTML = items.map(it => {
      const p = it.product;
      const line = Shop.toNumber(it.qty, 0) * Shop.toNumber(p.price, 0);

      const priceLine =
        (p.discountPercent > 0 && p.listPrice > p.price)
          ? `${Shop.formatMoney(p.price)} (pre: ${Shop.formatMoney(p.listPrice)} / -${p.discountPercent}%)`
          : `${Shop.formatMoney(p.price)}`;

      return `
        <div class="item" data-id="${Shop.escapeHtml(p.id)}">
          <div class="top">
            <div>
              <p class="name">${Shop.escapeHtml(p.name)}</p>
              <div class="muted">${Shop.escapeHtml(p.category)} • ${Shop.escapeHtml(p.brand || "")}</div>
              <div class="muted">Cena: ${Shop.escapeHtml(priceLine)}</div>
              <div class="muted">Line: <strong style="color:var(--text)">${Shop.escapeHtml(Shop.formatMoney(line))}</strong></div>
            </div>
            <div class="row">
              <button class="btn small" data-action="details" type="button">Opis</button>
              <button class="btn small danger" data-action="remove" type="button">Remove</button>
            </div>
          </div>

          <div class="qty">
            <button class="btn small" data-action="dec" type="button">−</button>
            <div class="pill">Qty: ${Shop.escapeHtml(it.qty)}</div>
            <button class="btn small" data-action="inc" type="button">+</button>
          </div>
        </div>
      `;
    }).join("");
  }

  els.list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const item = e.target.closest(".item");
    if (!item) return;

    const id = item.getAttribute("data-id");
    const action = btn.getAttribute("data-action");

    const cart = Shop.loadCart();
    const existing = cart[id];
    if (!existing) return;

    if (action === "inc") Shop.setQty(id, Shop.toNumber(existing.qty, 0) + 1);
    if (action === "dec") Shop.setQty(id, Shop.toNumber(existing.qty, 0) - 1);
    if (action === "remove") Shop.setQty(id, 0);

    if (action === "details") post("openProduct", { id });

    render();
    post("cartUpdated");
  });

  els.clearBtn.addEventListener("click", () => {
    Shop.clearCart();
    render();
    post("cartUpdated");
  });

  els.checkoutBtn.addEventListener("click", () => post("openCheckout"));
  els.closeBtn.addEventListener("click", () => post("closeCart"));

  window.addEventListener("message", (event) => {
    const data = event.data || {};
    if (data.type === "refreshCart") render();
  });

  render();
})();