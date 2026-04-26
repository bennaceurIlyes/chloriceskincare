/* =============================================
   CHLORICE — App Orchestrator
   Loads products from Supabase, then initializes UI
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  // Show skeleton loaders while data loads
  Skeletons.inject('featured-products-grid', 3);
  Skeletons.inject('all-products-grid', 6);

  // Load products from Supabase first (updates productData with real prices/images)
  await loadSupabaseProducts();

  // Then initialize all modules
  // Initialize ProductDetail first so it sets up data-i18n attributes
  ProductDetail.init();

  // Then initialize i18n and other modules
  I18n.init();
  Navbar.init();
  Parallax.init();
  ScrollReveal.init();
  Marquee.init();
  SmoothNav.init();
  Cart.init();

  // Dynamically render products on pages that need it
  if (typeof renderDynamicProducts === 'function') {
    renderDynamicProducts();
  }
});
