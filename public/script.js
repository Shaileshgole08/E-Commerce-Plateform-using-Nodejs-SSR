const navbar = document.getElementById('mainNavbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });
}

const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburgerBtn && mobileMenu) {
  hamburgerBtn.addEventListener('click', () => {
    hamburgerBtn.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!hamburgerBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
      hamburgerBtn.classList.remove('open');
      mobileMenu.classList.remove('open');
    }
  });
}

document.querySelectorAll('.flash-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const flash = btn.closest('.flash');
    flash.style.animation = 'slideInRight 0.3s reverse forwards';
    setTimeout(() => flash.remove(), 300);
  });
});
setTimeout(() => {
  document.querySelectorAll('.flash').forEach(flash => {
    flash.style.opacity = '0';
    flash.style.transform = 'translateX(120%)';
    flash.style.transition = '0.5s ease';
    setTimeout(() => flash.remove(), 500);
  });
}, 5000);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animationPlayState = 'running';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.animate-fade-in-up').forEach(el => {
  el.style.animationPlayState = 'paused';
  observer.observe(el);
});

const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
  const count = 25;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      animation-duration: ${Math.random() * 15 + 10}s;
      animation-delay: ${Math.random() * 10}s;
      opacity: ${Math.random() * 0.4 + 0.1};
    `;
    particlesContainer.appendChild(p);
  }
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.querySelectorAll('.product-img, .cart-item-img, .order-item-img').forEach(img => {
  img.addEventListener('load', () => {
    img.style.opacity = '1';
  });
  if (img.complete) img.style.opacity = '1';
  else img.style.opacity = '0';
  img.style.transition = 'opacity 0.4s ease';
});

document.querySelectorAll('.admin-table tbody tr').forEach(row => {
  row.addEventListener('mouseenter', () => row.style.background = 'rgba(201,168,76,0.03)');
  row.addEventListener('mouseleave', () => row.style.background = '');
});

document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', function (e) {
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = 'var(--danger)';
        field.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)';
        valid = false;
        setTimeout(() => {
          field.style.borderColor = '';
          field.style.boxShadow = '';
        }, 3000);
      }
    });
    if (!valid) {
      e.preventDefault();
      const firstInvalid = form.querySelector('[required]:invalid, [required][style*="danger"]');
      if (firstInvalid) firstInvalid.focus();
    }
  });
});

document.querySelectorAll('.overlay-form').forEach(form => {
  form.addEventListener('submit', function () {
    const btn = form.querySelector('.overlay-btn');
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Added!';
      btn.style.background = 'var(--success)';
    }
  });
});

const backToTopBtn = document.createElement('button');
backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
backToTopBtn.id = 'backToTop';
backToTopBtn.setAttribute('aria-label', 'Back to top');
backToTopBtn.style.cssText = `
  position: fixed; bottom: 28px; right: 28px;
  width: 44px; height: 44px;
  background: linear-gradient(135deg, #c9a84c, #a07830);
  color: #0d0d0d; border: none; border-radius: 50%;
  font-size: 1rem; cursor: pointer;
  box-shadow: 0 4px 20px rgba(201,168,76,0.3);
  display: none; align-items: center; justify-content: center;
  z-index: 999; transition: all 0.3s ease;
`;
document.body.appendChild(backToTopBtn);

backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
backToTopBtn.addEventListener('mouseenter', () => { backToTopBtn.style.transform = 'translateY(-3px)'; });
backToTopBtn.addEventListener('mouseleave', () => { backToTopBtn.style.transform = 'translateY(0)'; });

window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    backToTopBtn.style.display = 'flex';
    backToTopBtn.style.opacity = '1';
  } else {
    backToTopBtn.style.opacity = '0';
    setTimeout(() => {
      if (window.scrollY <= 400) backToTopBtn.style.display = 'none';
    }, 300);
  }
});

function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); }
    else el.textContent = Math.floor(start).toLocaleString();
  }, 16);
}
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.textContent.replace(/[^0-9]/g, ''));
      if (!isNaN(target) && target > 0) animateCounter(el, target);
      statsObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-card-num').forEach(el => statsObserver.observe(el));

console.log('%c🛍️ Raju Bag House', 'color: #c9a84c; font-size: 20px; font-weight: bold;');
console.log('%cPremium E-Commerce Platform', 'color: #a0a0a0; font-size: 12px;');
