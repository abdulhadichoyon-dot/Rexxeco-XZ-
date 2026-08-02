/* =========================================================
   REXXECO XZ — Interactions
   ========================================================= */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------
     LOADING SCREEN
     ----------------------------------------------------- */
  function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const barFill = document.getElementById('loading-bar-fill');

    if (!loadingScreen || !barFill) return;

    document.body.classList.add('no-scroll');

    if (prefersReducedMotion) {
      barFill.style.width = '100%';
      finishLoading(loadingScreen);
      return;
    }

    let progress = 0;
    const target = 100;
    const tick = () => {
      // Ease toward target with a bit of randomness for a "real" feel,
      // then snap to 100 once the page is actually ready.
      const increment = Math.max(1, (target - progress) * 0.09);
      progress = Math.min(target, progress + increment);
      barFill.style.width = progress + '%';

      if (progress < 99.3) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);

    const minDisplayTime = 1400;
    const startedAt = Date.now();

    const finish = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      setTimeout(() => {
        barFill.style.width = '100%';
        setTimeout(() => finishLoading(loadingScreen), 250);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish, { once: true });
      // Safety net in case 'load' is delayed by slow assets.
      setTimeout(finish, 3200);
    }
  }

  function finishLoading(loadingScreen) {
    loadingScreen.classList.add('hidden');
    document.body.classList.remove('no-scroll');
    loadingScreen.setAttribute('aria-hidden', 'true');
    triggerHeroReveal();
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 800);
  }

  /* -----------------------------------------------------
     HERO STAGGERED REVEAL
     ----------------------------------------------------- */
  function triggerHeroReveal() {
    const items = document.querySelectorAll('.reveal[data-reveal]');
    items.forEach((el) => {
      const step = Number(el.getAttribute('data-reveal')) || 1;
      const delay = prefersReducedMotion ? 0 : step * 110;
      setTimeout(() => el.classList.add('in'), delay);
    });
  }

  /* -----------------------------------------------------
     BACKGROUND PARTICLES
     ----------------------------------------------------- */
  function initParticles() {
    const container = document.getElementById('bg-particles');
    if (!container || prefersReducedMotion) return;

    const isMobile = window.innerWidth < 700;
    const count = isMobile ? 14 : 28;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      const left = Math.random() * 100;
      const duration = 14 + Math.random() * 18;
      const delay = Math.random() * -duration;
      const size = 1.5 + Math.random() * 2.5;

      p.style.left = left + 'vw';
      p.style.bottom = '-10px';
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.animationDuration = duration + 's';
      p.style.animationDelay = delay + 's';

      frag.appendChild(p);
    }
    container.appendChild(frag);
  }

  /* -----------------------------------------------------
     NAVBAR SCROLL STATE
     ----------------------------------------------------- */
  function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let ticking = false;
    const update = () => {
      if (window.scrollY > 24) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* -----------------------------------------------------
     MOBILE MENU
     ----------------------------------------------------- */
  function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!hamburger || !menu) return;

    const closeMenu = () => {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open menu');
      menu.classList.remove('open');
    };

    const openMenu = () => {
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.setAttribute('aria-label', 'Close menu');
      menu.classList.add('open');
    };

    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* -----------------------------------------------------
     SMOOTH SCROLL FOR IN-PAGE LINKS
     ----------------------------------------------------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        const navOffset = 90;
        const top = target.getBoundingClientRect().top + window.scrollY - navOffset;

        window.scrollTo({
          top,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      });
    });
  }

  /* -----------------------------------------------------
     SCROLL REVEAL (IntersectionObserver)
     ----------------------------------------------------- */
  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal-on-scroll');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in-view'));
      return;
    }

    // Stagger elements that share a common parent (cards, points, steps)
    const groups = new Map();
    items.forEach((el) => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach((group) => {
      group.forEach((el, i) => {
        el.style.setProperty('--d', String(i * 90));
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* -----------------------------------------------------
     HOW-IT-WORKS TIMELINE FILL
     ----------------------------------------------------- */
  function initTimelineFill() {
    const section = document.getElementById('how-it-works');
    const fill = document.getElementById('how-line-fill');
    if (!section || !fill) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      fill.style.width = '100%';
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fill.style.width = '100%';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(section);
  }

  /* -----------------------------------------------------
     FOOTER YEAR
     ----------------------------------------------------- */
  function initFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* -----------------------------------------------------
     SUBTLE HERO PARALLAX (desktop only, mouse-driven)
     ----------------------------------------------------- */
  function initHeroParallax() {
    if (prefersReducedMotion) return;
    const orb = document.querySelector('.orb-wrap');
    const hero = document.querySelector('.hero');
    if (!orb || !hero || window.innerWidth < 900) return;

    let raf = null;

    hero.addEventListener('mousemove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        orb.style.transform = `translate(${relX * 16}px, ${relY * 16}px)`;
        raf = null;
      });
    });

    hero.addEventListener('mouseleave', () => {
      orb.style.transform = 'translate(0, 0)';
    });
  }

  /* -----------------------------------------------------
     INIT
     ----------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initLoadingScreen();
    initParticles();
    initNavbarScroll();
    initMobileMenu();
    initSmoothScroll();
    initScrollReveal();
    initTimelineFill();
    initFooterYear();
    initHeroParallax();
  });
})();
