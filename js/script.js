document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHeroCarousel();
  initMasks();
  initCepLookup();
  initPlanSelection();
  initFormValidation();
});

/* Hero Carousel */
function initHeroCarousel() {
  const hero = document.querySelector('.hero');
  const carousel = document.getElementById('heroCarousel');
  if (!hero || !carousel) return;

  const slides = carousel.querySelectorAll('.hero-slide');
  const controls = hero.querySelector('.hero-controls');
  const dots = hero.querySelectorAll('.hero-dot');
  const prevBtn = hero.querySelector('.hero-carousel-prev');
  const nextBtn = hero.querySelector('.hero-carousel-next');
  const cardTitle = document.getElementById('heroCardTitle');
  const cardSub = document.getElementById('heroCardSub');

  let current = 0;
  let autoplayTimer;
  const INTERVAL = 5000;

  function goTo(index) {
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-selected', i === current);
    });

    const activeSlide = slides[current];
    if (cardTitle) cardTitle.textContent = activeSlide.dataset.caption || '';
    if (cardSub) cardSub.textContent = activeSlide.dataset.sub || '';
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(next, INTERVAL);
  }

  function stopAutoplay() {
    clearInterval(autoplayTimer);
  }

  prevBtn.addEventListener('click', () => { prev(); startAutoplay(); });
  nextBtn.addEventListener('click', () => { next(); startAutoplay(); });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index, 10));
      startAutoplay();
    });
  });

  hero.addEventListener('mouseenter', stopAutoplay);
  hero.addEventListener('mouseleave', startAutoplay);

  controls.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prev(); startAutoplay(); }
    if (e.key === 'ArrowRight') { next(); startAutoplay(); }
  });

  startAutoplay();
}

/* Navigation */
function initNavigation() {
  const header = document.querySelector('.header');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  const updateHeader = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };

  window.addEventListener('scroll', updateHeader);
  updateHeader();

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* Input Masks */
function initMasks() {
  const cpf = document.getElementById('cpf');
  const telefone = document.getElementById('telefone');
  const cep = document.getElementById('cep');

  cpf.addEventListener('input', (e) => {
    e.target.value = maskCPF(e.target.value);
  });

  telefone.addEventListener('input', (e) => {
    e.target.value = maskPhone(e.target.value);
  });

  cep.addEventListener('input', (e) => {
    e.target.value = maskCEP(e.target.value);
  });
}

function maskCPF(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
}

function maskCEP(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
}

/* CEP Lookup via ViaCEP */
function initCepLookup() {
  const cepInput = document.getElementById('cep');

  cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();

      if (data.erro) return;

      document.getElementById('rua').value = data.logradouro || '';
      document.getElementById('bairro').value = data.bairro || '';
      document.getElementById('cidade').value = data.localidade || '';
      document.getElementById('estado').value = data.uf || '';
      document.getElementById('numero').focus();
    } catch {
      /* silently fail — user can fill manually */
    }
  });
}

/* Plan selection from cards */
function initPlanSelection() {
  document.querySelectorAll('[data-plano]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plano = btn.dataset.plano;
      const select = document.getElementById('plano');
      if (select) {
        select.value = plano;
      }
    });
  });
}

/* Form Validation & Submit */
function initFormValidation() {
  const form = document.getElementById('formCadastro');
  const successMsg = document.getElementById('formSuccess');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm(form)) return;

    const submitBtn = form.querySelector('.btn-submit');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    submitBtn.disabled = true;
    btnText.hidden = true;
    btnLoading.hidden = false;

    await new Promise(resolve => setTimeout(resolve, 1500));

    form.querySelectorAll('.form-group:not(.form-check)').forEach(group => {
      const input = group.querySelector('input, select, textarea');
      if (input && input.type !== 'file') input.value = '';
    });

    form.querySelector('#lgpd').checked = false;
    submitBtn.disabled = false;
    btnText.hidden = false;
    btnLoading.hidden = true;
    successMsg.hidden = false;

    successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      successMsg.hidden = true;
    }, 8000);
  });

  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('error')) validateField(field);
    });
  });
}

function validateForm(form) {
  let valid = true;
  const fields = form.querySelectorAll('[required]');

  fields.forEach(field => {
    if (!validateField(field)) valid = false;
  });

  return valid;
}

function validateField(field) {
  const group = field.closest('.form-group');
  const errorEl = group?.querySelector('.form-error');
  let message = '';

  if (field.type === 'checkbox') {
    if (!field.checked) message = 'Você precisa aceitar os termos.';
  } else if (!field.value.trim()) {
    message = 'Este campo é obrigatório.';
  } else if (field.id === 'cpf' && !isValidCPF(field.value)) {
    message = 'CPF inválido.';
  } else if (field.id === 'email' && !isValidEmail(field.value)) {
    message = 'E-mail inválido.';
  } else if (field.id === 'telefone' && field.value.replace(/\D/g, '').length < 10) {
    message = 'Telefone inválido.';
  } else if (field.id === 'cep' && field.value.replace(/\D/g, '').length !== 8) {
    message = 'CEP inválido.';
  }

  if (message) {
    field.classList.add('error');
    group?.classList.add('error');
    if (errorEl) errorEl.textContent = message;
    return false;
  }

  field.classList.remove('error');
  group?.classList.remove('error');
  if (errorEl) errorEl.textContent = '';
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidCPF(cpf) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(digits[10]);
}
