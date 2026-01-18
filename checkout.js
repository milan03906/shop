(() => {
  const els = {
    meta: document.getElementById("meta"),
    summary: document.getElementById("summary"),
    form: document.getElementById("form"),
    done: document.getElementById("done"),
    closeBtn: document.getElementById("closeBtn"),
    cancelBtn: document.getElementById("cancelBtn"),

    name: document.getElementById("name"),
    email: document.getElementById("email"),
    address: document.getElementById("address"),
    pay: document.getElementById("pay"),
    note: document.getElementById("note"),
  };

  function post(type, extra = {}) {
    try { window.parent.postMessage({ type, ...extra }, "*"); } catch { }
  }

  function renderSummary() {
    const cart = Shop.loadCart();
    const items = Shop.cartItems(cart);
    const subtotal = Shop.cartSubtotal(cart);

    els.meta.textContent = `Stavke: ${items.length} • Qty: ${Shop.cartCount(cart)}`;

    if (items.length === 0) {
      els.summary.textContent = "Korpa je prazna. Vrati se u korpu i dodaj proizvode.";
      return;
    }

    const lines = items.map(it => {
      const p = it.product;
      const lineTotal = it.qty * p.price;
      const extra =
        (p.discountPercent > 0 && p.listPrice > p.price)
          ? ` (pre: ${Shop.formatMoney(p.listPrice)} / -${p.discountPercent}%)`
          : "";
      return `• ${it.qty}× ${p.name} — ${Shop.formatMoney(lineTotal)}${extra}`;
    });

    els.summary.textContent = `Stavke:\n${lines.join("\n")}\n\nSubtotal: ${Shop.formatMoney(subtotal)}`;
  }

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();

    const cart = Shop.loadCart();
    const items = Shop.cartItems(cart);
    if (items.length === 0) return;

    const name = (els.name.value || "").trim();
    const email = (els.email.value || "").trim();
    const address = (els.address.value || "").trim();
    const pay = els.pay.value;

    if (!name || !email || !address) return;

    const total = Shop.formatMoney(Shop.cartSubtotal(cart));
    const orderId = `ORD-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

    Shop.clearCart();
    post("cartUpdated");

    els.form.style.display = "none";
    els.done.style.display = "block";
    els.done.textContent =
      `Hvala, ${name}!\n` +
      `Narudžbina: ${orderId}\n` +
      `Iznos: ${total}\n` +
      `Plaćanje: ${pay}\n` +
      `Adresa: ${address}\n\n` +
      `(Demo checkout)`;

    post("checkoutComplete");
  });

  els.closeBtn.addEventListener("click", () => post("closeCheckout"));
  els.cancelBtn.addEventListener("click", () => post("closeCheckout"));

  renderSummary();
})();