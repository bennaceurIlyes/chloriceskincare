/* =============================================
   CHLORICE — i18n Engine
   Automatic language detection + manual switching
   with RTL support and smooth transitions
   ============================================= */

const I18n = {
  currentLang: 'en',
  supportedLangs: ['en', 'fr', 'ar'],

  /**
   * Detect the best language from the browser settings.
   * Maps browser locale codes to the 3 supported languages.
   */
  detectLanguage() {
    // Check several sources for the browser language
    const sources = [
      navigator.language,
      navigator.userLanguage,
      ...(navigator.languages || [])
    ].filter(Boolean);

    for (const locale of sources) {
      const code = locale.toLowerCase().split('-')[0]; // "fr-FR" → "fr"
      if (this.supportedLangs.includes(code)) {
        return code;
      }
    }

    return 'en'; // fallback
  },

  init() {
    const saved = localStorage.getItem('chlorice-lang');

    if (saved && this.supportedLangs.includes(saved)) {
      // Returning visitor — use their saved preference
      this.currentLang = saved;
    } else {
      // First visit — auto-detect from browser
      this.currentLang = this.detectLanguage();
      localStorage.setItem('chlorice-lang', this.currentLang);
    }

    this.apply(this.currentLang);
    this.bindSwitcher();
  },

  apply(lang) {
    this.currentLang = lang;
    localStorage.setItem('chlorice-lang', lang);

    const html = document.documentElement;

    // Direction & language attribute
    if (lang === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', lang === 'fr' ? 'fr' : 'en');
    }

    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = translations[lang][key];
        } else {
          el.textContent = translations[lang][key];
        }
      }
    });

    // Update active buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update spinning badge SVG text
    const badgeText = document.querySelector('.badge-text');
    if (badgeText && translations[lang]['badge.text']) {
      badgeText.textContent = translations[lang]['badge.text'].repeat(2);
    }

    // Notify other modules
    document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
  },

  t(key) {
    return (translations[this.currentLang] && translations[this.currentLang][key]) || key;
  },

  bindSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newLang = btn.dataset.lang;
        if (newLang === this.currentLang) return;

        // Smooth content transition
        document.body.style.opacity = '0.6';
        document.body.style.transition = 'opacity 0.15s ease';

        setTimeout(() => {
          this.apply(newLang);
          document.body.style.opacity = '1';
        }, 150);
      });
    });
  }
};
