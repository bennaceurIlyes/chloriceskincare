/* =============================================
   CHLORICE — Cart Module
   Cart drawer, add/remove, checkout link
   ============================================= */

const Cart = {
  items: [],

  /* Prices come from productData (updated by Supabase) with fallback */
  getPrice(id) {
    return productData[id]?.price || { cream: 3500, oil: 2800, serum: 4200 }[id] || 0;
  },

  init() {
    this.items = JSON.parse(localStorage.getItem('chlorice-cart') || '[]');
    this.injectDrawer();
    this.updateBadge();
    this.bindEvents();
  },

  injectDrawer() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div id="cart-overlay" class="cart-overlay"></div>
      <aside id="cart-drawer" class="cart-drawer">
        <div class="flex items-center justify-between p-6" style="border-bottom:.5px solid rgba(26,36,33,.12)">
          <h3 class="font-heading font-playfair text-xl" data-i18n="cart.title">Your Cart</h3>
          <button id="cart-close-btn" style="background:none;border:none;cursor:pointer;padding:8px" class="hover:opacity-50 transition-all">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div id="cart-items-list" class="flex-1 overflow-y-auto p-6"></div>
        <div id="cart-footer" class="p-6" style="border-top:.5px solid rgba(26,36,33,.12);display:none">
          <div class="flex justify-between items-center mb-6">
            <span class="font-semibold" data-i18n="cart.total">Total</span>
            <span class="text-xl font-semibold text-gold" id="cart-total-val">0 DZD</span>
          </div>
          <a href="checkout.html" class="btn-primary" style="display:flex;width:100%;justify-content:center;text-align:center;text-decoration:none">
            <span data-i18n="cart.checkout">Proceed to Checkout</span>
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </aside>`;
    document.body.appendChild(wrap);
  },

  bindEvents() {
    document.getElementById('cart-icon')?.addEventListener('click', () => this.open());
    document.getElementById('cart-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('cart-overlay')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        this.add(btn.dataset.product);
      });
    });
  },

  add(id) {
    const item = this.items.find(i => i.id === id);
    if (item) item.qty++; else this.items.push({ id, qty: 1 });
    this.save();
    this.toast(id);
    this.open();
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.render();
  },

  updateQty(id, d) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.qty += d;
    if (item.qty <= 0) this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.render();
  },

  save() {
    localStorage.setItem('chlorice-cart', JSON.stringify(this.items));
    this.updateBadge();
  },

  getTotal() {
    return this.items.reduce((s, i) => s + this.getPrice(i.id) * i.qty, 0);
  },

  updateBadge() {
    const b = document.getElementById('cart-badge');
    const c = this.items.reduce((s, i) => s + i.qty, 0);
    if (b) { b.textContent = c; b.style.display = c > 0 ? 'flex' : 'none'; }
  },

  open() {
    this.render();
    document.getElementById('cart-overlay')?.classList.add('active');
    document.getElementById('cart-drawer')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  close() {
    document.getElementById('cart-overlay')?.classList.remove('active');
    document.getElementById('cart-drawer')?.classList.remove('active');
    document.body.style.overflow = '';
  },

  render() {
    const list = document.getElementById('cart-items-list');
    const footer = document.getElementById('cart-footer');
    if (!list) return;

    if (this.items.length === 0) {
      list.innerHTML = '<div class="text-center py-16"><svg class="mx-auto mb-4 opacity-20" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg><p class="text-forest/40 text-sm" data-i18n="cart.empty">Your cart is empty</p></div>';
      if (footer) footer.style.display = 'none';
      I18n.apply(I18n.currentLang);
      return;
    }

    if (footer) footer.style.display = 'block';
    list.innerHTML = this.items.map(item => {
      const name = I18n.t(`product.${item.id}.name`);
      const price = this.getPrice(item.id);
      const img = productData[item.id]?.img || '';
      return `<div class="flex gap-4 mb-5 pb-5" style="border-bottom:.5px solid rgba(26,36,33,.08)">
        <img src="${img}" alt="" class="w-20 h-20 object-cover rounded-xl shrink-0">
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate">${name}</p>
          <p class="text-gold text-sm mt-1">${(price * item.qty).toLocaleString()} DZD</p>
          <div class="flex items-center gap-3 mt-3">
            <button onclick="Cart.updateQty('${item.id}',-1)" class="cart-qty-btn">\u2212</button>
            <span class="text-sm font-medium w-5 text-center">${item.qty}</span>
            <button onclick="Cart.updateQty('${item.id}',1)" class="cart-qty-btn">+</button>
            <button onclick="Cart.remove('${item.id}')" class="ml-auto cart-remove-btn">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    document.getElementById('cart-total-val').textContent = `${this.getTotal().toLocaleString()} DZD`;
    I18n.apply(I18n.currentLang);
  },

  toast(id) {
    const name = I18n.t(`product.${id}.name`);
    const t = document.createElement('div');
    t.className = 'cart-toast';
    t.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg> ${name}`;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2200);
  },

  clear() {
    this.items = [];
    this.save();
  }
};
