/* =========================================================================
   Sampaio Advocacia — Script principal
   Comportamentos: menu mobile, cabeçalho ao rolar, scroll suave com offset,
   revelação de seções e validação do formulário de contato.
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  /* Inicializa os ícones Lucide */
  if (window.lucide) {
    lucide.createIcons();
  }

  initHeaderScrollState();
  initMobileMenu();
  initSmoothAnchorScroll();
  initScrollReveal();
  initContactForm();
  initCurrentYear();
});

/* -------------------------------------------------------------------------
   Cabeçalho: adiciona sombra/borda após rolagem
   ------------------------------------------------------------------------- */
function initHeaderScrollState() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const applyState = () => {
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  applyState();
  window.addEventListener('scroll', applyState, { passive: true });
}

/* -------------------------------------------------------------------------
   Menu mobile: abre/fecha o painel de navegação
   ------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!toggleBtn || !mobileMenu) return;

  const iconOpen = toggleBtn.querySelector('[data-icon="menu"]');
  const iconClose = toggleBtn.querySelector('[data-icon="close"]');

  const setMenuState = (isOpen) => {
    mobileMenu.classList.toggle('is-open', isOpen);
    mobileMenu.classList.toggle('hidden', false);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    if (iconOpen && iconClose) {
      iconOpen.classList.toggle('hidden', isOpen);
      iconClose.classList.toggle('hidden', !isOpen);
    }
    document.body.classList.toggle('overflow-hidden', isOpen);
  };

  toggleBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('is-open');
    setMenuState(!isOpen);
  });

  /* Fecha o menu ao clicar em qualquer link de navegação */
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuState(false));
  });

  /* Fecha o menu com a tecla Escape */
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuState(false);
  });
}

/* -------------------------------------------------------------------------
   Scroll suave para as âncoras internas, com marcação do item ativo
   ------------------------------------------------------------------------- */
function initSmoothAnchorScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      event.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', targetId);
    });
  });

  /* Destaca o link de navegação correspondente à seção visível */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach((navLink) => {
          const matches = navLink.getAttribute('href') === `#${id}`;
          navLink.setAttribute('aria-current', matches ? 'true' : 'false');
        });
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/* -------------------------------------------------------------------------
   Revelação suave dos blocos de conteúdo ao entrar na viewport
   ------------------------------------------------------------------------- */
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------------------------------
   Validação do formulário de contato
   Impede o envio com campos vazios ou inválidos e exibe um retorno
   profissional diretamente na página, sem uso de alert() do navegador.
   ------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const successPanel = document.getElementById('form-success');
  const fields = {
    nome: form.querySelector('#nome'),
    email: form.querySelector('#email'),
    telefone: form.querySelector('#telefone'),
    mensagem: form.querySelector('#mensagem'),
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9()+\-\s]{8,}$/;

  const validators = {
    nome: (value) => value.trim().length >= 2,
    email: (value) => emailPattern.test(value.trim()),
    telefone: (value) => phonePattern.test(value.trim()),
    mensagem: (value) => value.trim().length >= 10,
  };

  const setFieldState = (field, isValid) => {
    const errorEl = document.getElementById(`${field.id}-error`);
    field.classList.toggle('field-invalid', !isValid);
    field.setAttribute('aria-invalid', String(!isValid));
    if (errorEl) {
      errorEl.classList.toggle('is-visible', !isValid);
    }
  };

  /* Validação em tempo real ao sair do campo */
  Object.entries(fields).forEach(([name, field]) => {
    if (!field) return;
    field.addEventListener('blur', () => {
      setFieldState(field, validators[name](field.value));
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    let formIsValid = true;

    Object.entries(fields).forEach(([name, field]) => {
      if (!field) return;
      const isValid = validators[name](field.value);
      setFieldState(field, isValid);
      if (!isValid) formIsValid = false;
    });

    if (!formIsValid) {
      if (successPanel) successPanel.classList.add('hidden');
      const firstInvalid = form.querySelector('.field-invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    /* Em um ambiente de produção, aqui seria realizada a chamada ao
       backend ou serviço de e-mail responsável pelo envio da mensagem. */
    form.reset();
    Object.values(fields).forEach((field) => {
      if (field) setFieldState(field, true);
    });

    if (successPanel) {
      successPanel.classList.remove('hidden');
      successPanel.setAttribute('tabindex', '-1');
      successPanel.focus();
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

/* -------------------------------------------------------------------------
   Ano corrente no rodapé
   ------------------------------------------------------------------------- */
function initCurrentYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
