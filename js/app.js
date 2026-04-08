/* =============================================
   CHLORICE — App Orchestrator
   Loads products from Supabase, then initializes UI
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  // Load products from Supabase first (updates productData with real prices/images)
  await loadSupabaseProducts();

  // Then initialize all modules
  I18n.init();
  Navbar.init();
  Parallax.init();
  ScrollReveal.init();
  Marquee.init();
  SmoothNav.init();
  ProductDetail.init();
  Cart.init();

  // Dynamically render products on pages that need it
  if (typeof renderDynamicProducts === 'function') {
    renderDynamicProducts();
  }
});
