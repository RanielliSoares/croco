/* CROCO Odontologia — interações do site */
(() => {
  'use strict';

  const WA_NUMBER = '5515981559770';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  /* ---------- Links do WhatsApp com mensagem pronta ---------- */
  $$('[data-wa]').forEach((el) => {
    el.href = waLink(el.dataset.wa);
  });

  /* ---------- Ano no rodapé ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Status "aberto agora" (Seg–Sex até 19h, horário de Brasília) ---------- */
  const status = $('#openStatus');
  if (status) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const day = now.getDay();
    const hour = now.getHours() + now.getMinutes() / 60;
    const open = day >= 1 && day <= 5 && hour >= 8 && hour < 19;
    status.textContent = open ? '· Aberto agora' : '';
    status.className = 'font-bold text-emerald-700';
  }

  /* ---------- Header, barra de progresso e botão de topo ---------- */
  const header = $('#siteHeader');
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');
  const parallaxEls = $$('[data-parallax]');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle('is-scrolled', y > 20);
    toTop.classList.toggle('is-visible', y > 700);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (!reduceMotion) {
      parallaxEls.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.1)`;
      });
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const burger = $('#burger');
  const mobileMenu = $('#mobileMenu');
  const setMenu = (open) => {
    burger.classList.toggle('is-open', open);
    mobileMenu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  burger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('is-open')));
  $$('a', mobileMenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1024) setMenu(false); });

  /* ---------- Link ativo no menu conforme a seção ---------- */
  const navLinks = $$('.nav-link');
  const sections = navLinks
    .map((link) => $(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));

    // Ao voltar para o topo, nenhum item fica ativo
    const hero = $('#inicio');
    if (hero) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) navLinks.forEach((l) => l.classList.remove('is-active'));
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
    }
  }

  /* ---------- Revelar elementos ao rolar ---------- */
  const revealEls = $$('[data-reveal]');
  const finishReveal = (el) => {
    // Remove o atributo depois da entrada para não conflitar com os efeitos de hover
    const delay = parseInt(getComputedStyle(el).getPropertyValue('--reveal-delay'), 10) || 0;
    setTimeout(() => {
      el.removeAttribute('data-reveal');
      el.classList.remove('is-visible');
      el.classList.add('is-visible-done');
    }, 900 + delay);
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.removeAttribute('data-reveal'));
    $$('.title-underline').forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        $$('.title-underline', el).forEach((t) => t.classList.add('is-visible'));
        finishReveal(el);
        obs.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => revealer.observe(el));
  }

  /* ---------- Contadores animados ---------- */
  const counters = $$('[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => counterObs.observe(el));
  }

  /* ---------- Cards: luz que segue o cursor e inclinação 3D ---------- */
  if (canHover && !reduceMotion) {
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);

        if (card.hasAttribute('data-tilt') && !card.hasAttribute('data-reveal')) {
          const rx = ((y / r.height) - 0.5) * -6;
          const ry = ((x / r.width) - 0.5) * 6;
          card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-8px)`;
        }
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Formulário de pré-agendamento ---------- */
  const form = $('#bookingForm');
  const phone = $('#phone');

  const maskPhone = (value) => {
    const d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  phone.addEventListener('input', () => {
    phone.value = maskPhone(phone.value);
  });

  $$('.field', form).forEach((field) => {
    field.addEventListener('input', () => field.classList.remove('is-invalid'));
  });

  const flagInvalid = (field) => {
    field.classList.add('is-invalid');
    field.classList.remove('shake');
    void field.offsetWidth; // reinicia a animação
    field.classList.add('shake');
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const tel = phone.value.replace(/\D/g, '');
    const treatment = $('#treatment').value;
    const message = $('#message').value.trim();

    let valid = true;
    if (name.length < 3) { flagInvalid($('#name')); valid = false; }
    if (tel.length < 10) { flagInvalid(phone); valid = false; }
    if (!valid) return;

    const lines = [
      `Olá! Meu nome é ${name}.`,
      `Gostaria de agendar uma avaliação de: ${treatment}.`,
      `Meu telefone: ${phone.value}.`,
    ];
    if (message) lines.push(`Observações: ${message}`);

    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
  });
})();
