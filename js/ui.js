/* =============================================
   CHLORICE — UI Module
   Scroll Reveal, Marquee, Navbar, Parallax
   ============================================= */

const ScrollReveal = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
};

const Navbar = {
  init() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });

    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (menuBtn && mobileNav) {
      menuBtn.addEventListener('click', () => mobileNav.classList.toggle('open'));
      mobileNav.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', () => mobileNav.classList.remove('open'))
      );
    }
  }
};

const Parallax = {
  init() {
    const bg = document.querySelector('.hero-bg');
    if (!bg) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight) {
        bg.style.transform = `translateY(${window.scrollY * 0.3}px) scale(1.1)`;
      }
    }, { passive: true });
  }
};

const Marquee = {
  init() {
    const track = document.querySelector('.marquee-track');
    if (!track) return;
    track.innerHTML += track.innerHTML;
  }
};

const SmoothNav = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
        }
      });
    });
  }
};

/* Product Detail Page Logic */
const ProductDetail = {
  init() {
    const container = document.getElementById('product-detail');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id || !productData[id]) return;

    const lang = localStorage.getItem('chlorice-lang') || 'en';
    const p = productData[id];

    // Set image
    const img = document.getElementById('detail-img');
    if (img) img.src = p.img;

    // Set text content
    const setText = (elId, key) => {
      const el = document.getElementById(elId);
      if (el) el.setAttribute('data-i18n', key);
    };

    setText('detail-name', `product.${id}.name`);
    setText('detail-price', `product.${id}.price`);
    setText('detail-tag', `product.${id}.tag`);
    setText('detail-desc', `product.${id}.desc`);
    setText('detail-ingredients', `product.${id}.ingredients`);
    setText('detail-ritual', `product.${id}.ritual`);

    // Tabs
    document.querySelectorAll('.detail-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.detail-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`dtab-${tab.dataset.tab}`)?.classList.add('active');
      });
    });
  }
};
