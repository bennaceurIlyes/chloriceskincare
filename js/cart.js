/* =============================================
   CHLORICE — Cart Module
   Robust implementation with Event Delegation
   ============================================= */

const Cart = {
  items: [],

  init() {
    // Load from storage
    try {
      this.items = JSON.parse(localStorage.getItem('chlorice-cart') || '[]');
    } catch(e) { 
      this.items = []; 
    }
    
    this.injectDrawer();
    this.updateBadge();
    this.setupDelegation();
    
    // Explicitly expose to window to ensure global availability
    window.Cart = this;
  },

  /* Prices come from productData with fallback */
  getPrice(id) {
    if (typeof productData !== 'undefined' && productData[id]) {
      return Number(productData[id].price) || 0;
    }
    return { cream: 3500, oil: 2800, serum: 4200 }[id] || 0;
  },

  /* Get name from translations or DB cache */
  getName(id) {
    const lang = (typeof I18n !== 'undefined' ? I18n.currentLang : localStorage.getItem('chlorice-lang')) || 'en';
    const translationKey = `product.${id}.name`;
    
    if (typeof translations !== 'undefined' && translations[lang] && translations[lang][translationKey]) {
      return translations[lang][translationKey];
    }
    if (typeof productData !== 'undefined' && productData[id] && productData[id].dbName) {
      return productData[id].dbName;
    }
    return id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ');
  },

  injectDrawer() {
    if (document.getElementById('cart-drawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.className = 'cart-overlay';
    document.body.appendChild(overlay);

    const drawer = document.createElement('aside');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
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
      </div>`;
    document.body.appendChild(drawer);
  },

  setupDelegation() {
    // SINGLE Listener for ALL clicks on the page related to cart
    document.addEventListener('click', (e) => {
      // 1. Add to Cart buttons (even dynamic ones)
      const addBtn = e.target.closest('.add-to-cart-btn');
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        const pId = addBtn.dataset.product;
        if (pId) this.add(pId);
        return;
      }

      // 2. Cart Icon in Navbar
      if (e.target.closest('#cart-icon')) {
        this.open();
        return;
      }

      // 3. Close buttons or Overlay
      if (e.target.closest('#cart-close-btn') || e.target.id === 'cart-overlay') {
        this.close();
        return;
      }

      // 4. Quantity Adjustments (using data-delta)
      const qtyBtn = e.target.closest('.cart-qty-btn');
      if (qtyBtn) {
        const pId = qtyBtn.dataset.product;
        const delta = parseInt(qtyBtn.dataset.delta);
        if (pId) this.updateQty(pId, delta);
        return;
      }

      // 5. Removes
      const removeBtn = e.target.closest('.cart-remove-btn');
      if (removeBtn) {
        const pId = removeBtn.dataset.product;
        if (pId) this.remove(pId);
        return;
      }
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  },

  add(id) {
    const item = this.items.find(i => i.id === id);
    if (item) item.qty++; else this.items.push({ id, qty: 1 });
    this.save();
    this.toast(id);
    if (typeof BadgeBump !== 'undefined') BadgeBump.trigger();
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
      list.innerHTML = `<div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
        </div>
        <h3 data-i18n="cart.empty">Your cart is empty</h3>
        <p>Browse our collection to find your perfect skincare ritual.</p>
      </div>`;
      if (footer) footer.style.display = 'none';
      if (typeof I18n !== 'undefined') I18n.apply(I18n.currentLang);
      return;
    }

    if (footer) footer.style.display = 'block';
    list.innerHTML = this.items.map(item => {
      const name = this.getName(item.id);
      const price = this.getPrice(item.id);
      const img = (typeof productData !== 'undefined' && productData[item.id]?.img) || '';
      
      return `<div class="flex gap-4 mb-5 pb-5" style="border-bottom:.5px solid rgba(26,36,33,.08)">
        <img src="${img}" alt="" class="w-20 h-20 object-cover rounded-xl shrink-0 bg-bone">
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate">${name}</p>
          <p class="text-gold text-sm mt-1">${(price * item.qty).toLocaleString()} DZD</p>
          <div class="flex items-center gap-3 mt-3">
            <button class="cart-qty-btn" data-product="${item.id}" data-delta="-1">\u2212</button>
            <span class="text-sm font-medium w-5 text-center">${item.qty}</span>
            <button class="cart-qty-btn" data-product="${item.id}" data-delta="1">+</button>
            <button class="ml-auto cart-remove-btn" data-product="${item.id}">
              <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    const totalVal = document.getElementById('cart-total-val');
    if (totalVal) totalVal.textContent = `${this.getTotal().toLocaleString()} DZD`;
    if (typeof I18n !== 'undefined') I18n.apply(I18n.currentLang);
  },

  toast(id) {
    const name = this.getName(id);
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
