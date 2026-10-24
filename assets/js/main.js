/* ==========================================================================
   قالب شب‌چله – اسکریپت اصلی
   نسخه: 1.1.0
   --------------------------------------------------------------------------
   بدون jQuery و بدون کتابخانه‌ی خارجی. تغییرات شخصی خود را در custom.js بنویسید
   تا با به‌روزرسانی قالب از بین نروند.
   ========================================================================== */

/* ==========================================================================
   تنظیمات قابل ویرایش
   ========================================================================== */

/**
 * تاریخ و ساعت پایان کمپین (تایمر شمارش معکوس)
 * قالب: سال-ماه-روز (میلادی) T ساعت:دقیقه:ثانیه + اختلاف ساعت ایران (+03:30)
 * مثال پیش‌فرض: پایان روز ۳۰ آذر ۱۴۰۵ (شب یلدا) = 2026-12-21 ساعت ۲۳:۵۹:۵۹ به وقت تهران
 */
const CAMPAIGN_END = '2026-12-21T23:59:59+03:30';

/**
 * پیام بعد از پایان زمان کمپین
 */
const CAMPAIGN_ENDED_TEXT = 'کمپین به پایان رسید';

(function () {
  'use strict';

  const root = document.documentElement;
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reduceMotionQuery.matches || root.classList.contains('no-motion');

  /* ------------------------------------------------------------------------
     ابزار: تبدیل اعداد انگلیسی به فارسی
     ------------------------------------------------------------------------ */
  const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  const toFa = (value) => String(value).replace(/\d/g, (d) => FA_DIGITS[d]);
  const pad = (n) => toFa(String(n).padStart(2, '0'));
  const toEn = (value) => String(value).replace(/[۰-۹]/g, (d) => FA_DIGITS.indexOf(d));

  /* ------------------------------------------------------------------------
     هدر شیشه‌ای: با اسکرول کلاس is-scrolled می‌گیرد
     ------------------------------------------------------------------------ */
  function initHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    let ticking = false;
    const update = () => {
      const scrolled = window.scrollY > 24;
      header.classList.toggle('is-scrolled', scrolled);
      root.classList.toggle('bar-away', scrolled); // نوار اعلان با اسکرول کنار می‌رود
      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* ------------------------------------------------------------------------
     منوی موبایل تمام‌صفحه (با کیبورد و کلید Esc قابل کنترل است)
     ------------------------------------------------------------------------ */
  function initMobileMenu() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) return;

    const header = document.getElementById('site-header');
    const focusables = () => menu.querySelectorAll('a[href], button:not([disabled])');

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      if (header) header.classList.toggle('is-scrolled', open || window.scrollY > 24);

      if (open) {
        menu.removeAttribute('inert');
        const first = focusables()[0];
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 350);
      } else {
        menu.setAttribute('inert', '');
      }
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // بستن منو بعد از انتخاب لینک
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;

      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
        return;
      }

      // نگه داشتن فوکوس داخل منو و دکمه‌ی بستن
      if (event.key === 'Tab') {
        const items = [toggle, ...focusables()];
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    // اگر صفحه بزرگ شد، منو بسته شود
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------------
     تایمر شمارش معکوس
     تاریخ پایان در متغیر CAMPAIGN_END (بالای همین فایل) تنظیم می‌شود.
     ------------------------------------------------------------------------ */
  function initCountdown() {
    const timers = document.querySelectorAll('[data-countdown]');
    if (!timers.length) return;

    const end = new Date(CAMPAIGN_END).getTime();
    if (Number.isNaN(end)) return;

    const state = {};

    const render = () => {
      const diff = Math.max(0, end - Date.now());
      const values = {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };

      timers.forEach((timer) => {
        Object.keys(values).forEach((key) => {
          const el = timer.querySelector(`[data-cd="${key}"]`);
          if (!el) return;
          const text = pad(values[key]);
          if (el.textContent !== text) {
            el.textContent = text;
            if (state[key] !== undefined && !prefersReducedMotion() && el.animate) {
              el.animate(
                [
                  { opacity: 0.35, transform: 'translateY(-0.35rem)' },
                  { opacity: 1, transform: 'none' },
                ],
                { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
              );
            }
          }
        });

        if (diff === 0) {
          timer.classList.add('is-ended');
          const ended = timer.querySelector('[data-countdown-ended]');
          if (ended) {
            ended.textContent = CAMPAIGN_ENDED_TEXT;
            ended.hidden = false;
          }
        }
      });

      Object.assign(state, values);
      return diff;
    };

    if (render() === 0) return;

    const loop = setInterval(() => {
      if (render() === 0) clearInterval(loop);
    }, 1000);
  }

  /* ------------------------------------------------------------------------
     پارالاکس ظریف روی تزئینات
     data-parallax : سرعت جابه‌جایی نسبت به اسکرول (مثلاً 0.2)
     data-pointer  : جابه‌جایی با حرکت ماوس به پیکسل (فقط دسکتاپ)
     ------------------------------------------------------------------------ */
  function initParallax() {
    const layers = Array.from(document.querySelectorAll('[data-parallax], [data-pointer]'));
    if (!layers.length || prefersReducedMotion()) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const items = layers.map((el) => ({
      el,
      speed: parseFloat(el.dataset.parallax || '0'),
      range: finePointer ? parseFloat(el.dataset.pointer || '0') : 0,
      section: el.closest('section') || document.body,
    }));

    let pointerX = 0;
    let pointerY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;

    const frame = () => {
      // حرکت نرم ماوس با میان‌یابی
      currentX += (pointerX - currentX) * 0.06;
      currentY += (pointerY - currentY) * 0.06;

      // ابتدا همه‌ی اندازه‌ها خوانده می‌شوند، بعد همه‌ی تغییرات نوشته می‌شوند (بدون layout اضافه)
      const viewport = window.innerHeight;
      const rects = new Map();
      items.forEach((item) => {
        if (!rects.has(item.section)) rects.set(item.section, item.section.getBoundingClientRect());
      });
      items.forEach((item) => {
        const rect = rects.get(item.section);
        if (rect.bottom < 0 || rect.top > viewport) return;
        const y = -rect.top * item.speed + currentY * item.range;
        const x = currentX * item.range;
        item.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      });

      const settled = Math.abs(pointerX - currentX) < 0.001 && Math.abs(pointerY - currentY) < 0.001;
      rafId = settled ? null : requestAnimationFrame(frame);
    };

    const request = () => {
      if (rafId === null) rafId = requestAnimationFrame(frame);
    };

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });

    if (finePointer) {
      window.addEventListener(
        'pointermove',
        (event) => {
          pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
          pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
          request();
        },
        { passive: true }
      );
    }

    request();
  }

  /* ------------------------------------------------------------------------
     نوار اعلان بالای صفحه (قابل بستن؛ تا پایان همان نشست بسته می‌ماند)
     ------------------------------------------------------------------------ */
  function initAnnouncementBar() {
    const bar = document.querySelector('[data-announce]');
    if (!bar) return;

    const close = bar.querySelector('[data-announce-close]');
    if (!close) return;

    close.addEventListener('click', () => {
      root.classList.add('bar-closed');
      bar.setAttribute('aria-hidden', 'true');
      try {
        sessionStorage.setItem('shab-bar-closed', '1');
      } catch (e) {
        /* حافظه‌ی مرورگر در دسترس نیست؛ مشکلی ایجاد نمی‌کند */
      }
      const skip = document.querySelector('.skip-link');
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------------
     ظاهر شدن نرم عناصر هنگام اسکرول
     هر عنصری با کلاس reveal یا reveal-clip وقتی وارد صفحه شود کلاس is-visible می‌گیرد.
     تأخیر هر عنصر با style="--d:200ms" تنظیم می‌شود.
     ------------------------------------------------------------------------ */
  function initReveal() {
    const items = document.querySelectorAll('.reveal, .reveal-clip');
    if (!items.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      // threshold 0: هر عنصری که حتی کمی داخل صفحه باشد (مثل محتوای بلند هنگام لود) فوراً نمایش داده می‌شود
      { rootMargin: '0px 0px -40px 0px', threshold: 0 }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     سبد خرید کشویی (mini-cart)
     - سبد فقط سمت کاربر و نمایشی است و در localStorage مرورگر ذخیره می‌شود؛
       برای پرداخت واقعی باید به فروشگاه یا بک‌اند شما وصل شود (Help.pdf).
     - هر محصول قابل افزودن، عنصری با ویژگی data-product است:
         data-product-id    شناسه‌ی یکتا (انگلیسی)
         data-product-name  نام محصول
         data-product-price قیمت به تومان، فقط عدد انگلیسی (مثل 1470000)
         data-product-image مسیر تصویر کوچک
       و دکمه‌ای با data-add-to-cart داخل آن.
     ------------------------------------------------------------------------ */
  const CART_KEY = 'shab-cart';

  const escapeHtml = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const cartStore = {
    read() {
      try {
        const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        return Array.isArray(items) ? items.filter((i) => i && i.id && i.qty > 0) : [];
      } catch (e) {
        return [];
      }
    },
    write(items) {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
      } catch (e) {
        /* حافظه‌ی مرورگر در دسترس نیست؛ سبد فقط تا رفرش بعدی می‌ماند */
      }
    },
  };

  function initCart() {
    const panel = document.querySelector('[data-mini-cart]');
    const overlay = document.querySelector('[data-cart-overlay]');
    const openers = document.querySelectorAll('[data-cart-open]');
    const badges = document.querySelectorAll('[data-cart-count]');
    let items = cartStore.read();
    let lastOpener = null;

    const list = panel && panel.querySelector('[data-cart-items]');
    const empty = panel && panel.querySelector('[data-cart-empty]');
    const foot = panel && panel.querySelector('[data-cart-foot]');
    const total = panel && panel.querySelector('[data-cart-total]');
    const headingCount = panel && panel.querySelector('[data-cart-heading-count]');
    const status = panel && panel.querySelector('[data-cart-status]');

    const count = () => items.reduce((sum, i) => sum + i.qty, 0);

    const bump = (badge) => {
      if (prefersReducedMotion() || !badge.animate) return;
      badge.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.45)', offset: 0.35 }, { transform: 'scale(0.9)', offset: 0.7 }, { transform: 'scale(1)' }],
        { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    };

    const renderBadges = (animate) => {
      const n = count();
      badges.forEach((badge) => {
        badge.textContent = toFa(n);
        badge.hidden = n === 0;
        if (animate && n) bump(badge);
      });
      openers.forEach((btn) => btn.setAttribute('aria-label', n ? `سبد خرید، ${toFa(n)} کالا` : 'سبد خرید، خالی'));
    };

    const render = () => {
      if (!panel) return;
      const n = count();
      list.innerHTML = items
        .map((item) => {
          const name = escapeHtml(item.name);
          return `<li class="cart-item" data-id="${escapeHtml(item.id)}">
  <img class="cart-thumb" src="${escapeHtml(item.image)}" width="80" height="80" alt="">
  <div class="cart-info">
    <p class="cart-name">${name}</p>
    <p class="cart-price"><span data-price>${formatPrice(item.price * item.qty)}</span> <span class="currency">تومان</span></p>
    <div class="cart-qty" role="group" aria-label="تعداد ${name}">
      <button type="button" data-qty="1" aria-label="افزایش تعداد ${name}">+</button>
      <span aria-live="off">${toFa(item.qty)}</span>
      <button type="button" data-qty="-1" aria-label="کاهش تعداد ${name}">−</button>
    </div>
  </div>
  <button type="button" class="cart-remove" data-remove aria-label="حذف ${name} از سبد">
    <svg aria-hidden="true"><use href="#i-close"/></svg>
  </button>
</li>`;
        })
        .join('');
      list.hidden = n === 0;
      empty.hidden = n !== 0;
      foot.hidden = n === 0;
      total.textContent = formatPrice(items.reduce((sum, i) => sum + i.price * i.qty, 0));
      headingCount.textContent = n ? `(${toFa(n)})` : '';
      initNumberSeparators(panel);
      // اطلاع به اسکریپت‌های دیگر (مثلاً سوییچر تم دمو برای تعویض تصاویر نمونه)
      document.dispatchEvent(new CustomEvent('shab:cart-render'));
    };

    const save = (animate) => {
      cartStore.write(items);
      renderBadges(animate);
      render();
    };

    const announce = (text) => {
      if (status) status.textContent = text;
    };

    /* ---- افزودن به سبد ---- */
    document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
      const label = button.querySelector('[data-cart-label]');
      const icon = button.querySelector('use');
      const original = label ? label.textContent : '';
      const originalIcon = icon ? icon.getAttribute('href') : '';
      let timer = null;

      button.addEventListener('click', () => {
        const product = button.closest('[data-product]');
        if (!product) return;
        const data = product.dataset;
        const id = data.productId;
        const existing = items.find((i) => i.id === id);
        if (existing) {
          existing.qty += 1;
        } else {
          items.push({
            id,
            name: data.productName,
            price: parseInt(data.productPrice, 10) || 0,
            // مسیر کامل ذخیره می‌شود تا در همه‌ی صفحه‌ها درست نمایش داده شود
            image: new URL(data.productImage, document.baseURI).href,
            qty: 1,
          });
        }
        save(true);
        announce(`${data.productName} به سبد اضافه شد`);

        // حالت «اضافه شد»: دکمه کامل طلایی می‌شود، بعد از ۱.۸ ثانیه به حالت عادی برمی‌گردد
        button.classList.add('is-added');
        if (label) label.textContent = 'به سبد اضافه شد';
        if (icon && originalIcon === '#i-bag') icon.setAttribute('href', '#i-check');
        clearTimeout(timer);
        timer = setTimeout(() => {
          button.classList.remove('is-added');
          if (label) label.textContent = original;
          if (icon) icon.setAttribute('href', originalIcon);
        }, 1800);
      });
    });

    renderBadges(false);
    if (!panel) return;
    render();

    /* ---- تعداد و حذف ---- */
    list.addEventListener('click', (event) => {
      const row = event.target.closest('.cart-item');
      if (!row) return;
      const item = items.find((i) => i.id === row.dataset.id);
      if (!item) return;
      const qtyBtn = event.target.closest('[data-qty]');
      const removeBtn = event.target.closest('[data-remove]');
      const index = items.indexOf(item);

      if (qtyBtn) {
        item.qty += parseInt(qtyBtn.dataset.qty, 10);
        if (item.qty < 1) items.splice(index, 1);
        announce(item.qty < 1 ? `${item.name} از سبد حذف شد` : `تعداد ${item.name}: ${toFa(item.qty)}`);
      } else if (removeBtn) {
        items.splice(index, 1);
        announce(`${item.name} از سبد حذف شد`);
      } else {
        return;
      }
      const action = qtyBtn ? `[data-qty="${qtyBtn.dataset.qty}"]` : null;
      save(false);

      // فوکوس کیبورد در جای منطقی بماند
      const sameRow = action && list.querySelector(`.cart-item[data-id="${CSS.escape(item.id)}"] ${action}`);
      const nextRow = list.querySelectorAll('.cart-item')[Math.min(index, items.length - 1)];
      const target = sameRow || (nextRow && nextRow.querySelector('[data-remove]')) || panel.querySelector('[data-cart-browse]');
      if (target) target.focus();
    });

    /* ---- باز و بسته کردن پنل ---- */
    const focusables = () =>
      Array.from(panel.querySelectorAll('a[href], button:not([disabled])')).filter((el) => !el.closest('[hidden]'));

    const isOpen = () => panel.classList.contains('is-open');

    const setOpen = (open, opener) => {
      if (open === isOpen()) return;
      panel.classList.toggle('is-open', open);
      if (overlay) overlay.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      openers.forEach((btn) => btn.setAttribute('aria-expanded', String(open)));

      if (open) {
        lastOpener = opener || document.activeElement;
        panel.removeAttribute('inert');
        const closeBtn = panel.querySelector('[data-cart-close]');
        setTimeout(() => closeBtn && closeBtn.focus({ preventScroll: true }), 60);
      } else {
        panel.setAttribute('inert', '');
        if (lastOpener && document.body.contains(lastOpener)) lastOpener.focus({ preventScroll: true });
      }
    };

    openers.forEach((btn) =>
      btn.addEventListener('click', () => {
        // اگر منوی موبایل باز است، اول بسته شود
        const menuToggle = document.querySelector('[data-menu-toggle][aria-expanded="true"]');
        if (menuToggle) menuToggle.click();
        setOpen(!isOpen(), btn);
      })
    );
    panel.querySelectorAll('[data-cart-close]').forEach((btn) => btn.addEventListener('click', () => setOpen(false)));
    if (overlay) overlay.addEventListener('click', () => setOpen(false));
    panel.querySelectorAll('[data-cart-browse]').forEach((link) => link.addEventListener('click', () => setOpen(false)));

    document.addEventListener('keydown', (event) => {
      if (!isOpen()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === 'Tab') {
        const els = focusables();
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    // هماهنگی بین تب‌های باز همین سایت
    window.addEventListener('storage', (event) => {
      if (event.key !== CART_KEY) return;
      items = cartStore.read();
      renderBadges(false);
      render();
    });
  }

  /* ------------------------------------------------------------------------
     دکمه‌ی علاقه‌مندی (قلب) روی کارت محصول
     ------------------------------------------------------------------------ */
  function initWishlist() {
    document.querySelectorAll('[data-wish]').forEach((button) => {
      button.addEventListener('click', () => {
        const pressed = button.getAttribute('aria-pressed') === 'true';
        button.setAttribute('aria-pressed', String(!pressed));
      });
    });
  }

  /* ------------------------------------------------------------------------
     سکشن sticky محصول شاخص: با رسیدن هر مرحله به وسط صفحه،
     تصویر، شماره و توضیح کوتاه سمت تصویر عوض می‌شود.
     ------------------------------------------------------------------------ */
  function initFeature() {
    const wrap = document.querySelector('[data-feature]');
    if (!wrap || !('IntersectionObserver' in window)) return;

    const steps = Array.from(wrap.querySelectorAll('[data-feature-step]'));
    const images = wrap.querySelectorAll('[data-feature-img]');
    const dots = wrap.querySelectorAll('[data-feature-dot]');
    const current = wrap.querySelector('[data-feature-current]');
    const caption = wrap.querySelector('[data-feature-caption]');
    let active = 0;

    const activate = (index) => {
      if (index === active) return;
      active = index;
      steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
      images.forEach((img, i) => img.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      if (current) current.textContent = pad(index + 1);
      if (caption) caption.textContent = steps[index].dataset.caption || '';
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activate(steps.indexOf(entry.target));
        });
      },
      // در موبایل (کمتر از 768px) حالت sticky با CSS خاموش است و این کلاس‌ها اثری ندارند
      { rootMargin: '-45% 0px -45% 0px' }
    );

    steps.forEach((step) => observer.observe(step));
  }

  /* ------------------------------------------------------------------------
     اسلایدر نظرات مشتریان (scroll-snap + دکمه‌های قبلی/بعدی + کیبورد)
     کلیدها وقتی فوکوس روی اسلایدر است: چپ/راست = نظر بعدی/قبلی، Home و End = ابتدا و انتها
     ------------------------------------------------------------------------ */
  function initSlider() {
    document.querySelectorAll('[data-slider]').forEach((slider) => {
      const track = slider.querySelector('[data-slider-track]');
      if (!track) return;

      const scope = slider.closest('section') || document;
      const prev = scope.querySelector('[data-slider-prev]');
      const next = scope.querySelector('[data-slider-next]');
      const progress = slider.querySelector('[data-slider-progress]');
      const status = slider.querySelector('[data-slider-status]');
      const slides = Array.from(track.children);
      const isRTL = getComputedStyle(track).direction === 'rtl';
      const dir = isRTL ? -1 : 1; // در راست‌چین، جلو رفتن یعنی اسکرول به چپ
      const behavior = () => (prefersReducedMotion() ? 'auto' : 'smooth');

      const step = () => {
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return slides[0].getBoundingClientRect().width + gap;
      };
      const maxScroll = () => track.scrollWidth - track.clientWidth;
      const position = () => Math.abs(track.scrollLeft);
      const currentIndex = () => Math.round(position() / step());

      const update = () => {
        const max = maxScroll();
        if (prev) prev.disabled = position() <= 2;
        if (next) next.disabled = position() >= max - 2;
        if (progress) {
          const visible = track.clientWidth / track.scrollWidth;
          const ratio = max > 0 ? position() / max : 1;
          progress.style.setProperty('--progress', (visible + (1 - visible) * ratio).toFixed(3));
        }
      };

      const go = (delta) => {
        const index = Math.min(slides.length - 1, Math.max(0, currentIndex() + delta));
        track.scrollBy({ left: dir * delta * step(), behavior: behavior() });
        if (status) status.textContent = `نظر ${toFa(index + 1)} از ${toFa(slides.length)}`;
      };

      if (prev) prev.addEventListener('click', () => go(-1));
      if (next) next.addEventListener('click', () => go(1));

      track.addEventListener('keydown', (event) => {
        const keys = { ArrowLeft: isRTL ? 1 : -1, ArrowRight: isRTL ? -1 : 1 };
        if (event.key in keys) {
          event.preventDefault();
          go(keys[event.key]);
        } else if (event.key === 'Home') {
          event.preventDefault();
          track.scrollTo({ left: 0, behavior: behavior() });
        } else if (event.key === 'End') {
          event.preventDefault();
          track.scrollTo({ left: dir * maxScroll(), behavior: behavior() });
        }
      });

      let frame = null;
      track.addEventListener(
        'scroll',
        () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(update);
        },
        { passive: true }
      );
      window.addEventListener('resize', update, { passive: true });
      update();
    });
  }

  /* ------------------------------------------------------------------------
     آکاردئون سوالات متداول (قابل دسترس)
     هر سوال یک دکمه با aria-expanded است. کلیدهای بالا/پایین، Home و End
     بین سوال‌ها جابه‌جا می‌شوند؛ Enter و Space باز و بسته می‌کنند.
     ------------------------------------------------------------------------ */
  function initAccordion() {
    document.querySelectorAll('[data-accordion]').forEach((accordion) => {
      const triggers = Array.from(accordion.querySelectorAll('[data-accordion-trigger]'));

      const setOpen = (trigger, open) => {
        trigger.setAttribute('aria-expanded', String(open));
        const item = trigger.closest('.faq-item');
        if (item) item.classList.toggle('is-open', open);
      };

      triggers.forEach((trigger, i) => {
        trigger.addEventListener('click', () => {
          setOpen(trigger, trigger.getAttribute('aria-expanded') !== 'true');
        });

        trigger.addEventListener('keydown', (event) => {
          const last = triggers.length - 1;
          const targets = {
            ArrowDown: triggers[i === last ? 0 : i + 1],
            ArrowUp: triggers[i === 0 ? last : i - 1],
            Home: triggers[0],
            End: triggers[last],
          };
          if (targets[event.key]) {
            event.preventDefault();
            targets[event.key].focus();
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     فرم خبرنامه (فقط اعتبارسنجی سمت کاربر)
     برای ثبت واقعی ایمیل‌ها، در محل مشخص‌شده درخواست را به سرویس خبرنامه‌ی خود بفرستید.
     ------------------------------------------------------------------------ */
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const hasRealAction = (form) => {
    const action = (form.getAttribute('action') || '').trim();
    return action !== '' && action !== '#';
  };

  function initNewsletter() {
    document.querySelectorAll('[data-newsletter]').forEach((form) => {
      const input = form.querySelector('input[type="email"]');
      const error = form.querySelector('[data-newsletter-error]');
      const success = form.parentElement.querySelector('[data-newsletter-success]');
      if (!input || !error) return;

      const showError = (message) => {
        input.setAttribute('aria-invalid', 'true');
        error.textContent = message;
        error.hidden = false;
        input.focus();
      };

      const clearError = () => {
        input.removeAttribute('aria-invalid');
        error.hidden = true;
      };

      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true' && EMAIL_PATTERN.test(input.value.trim())) clearError();
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value) return showError('لطفاً ایمیل خود را وارد کنید.');
        if (!EMAIL_PATTERN.test(value)) return showError('ایمیل واردشده معتبر نیست؛ مثال درست: name@example.com');
        clearError();

        // اتصال به سرویس خبرنامه: اگر action فرم به آدرس واقعی تنظیم شده باشد، ایمیل به همان آدرس ارسال می‌شود.
        if (hasRealAction(form)) {
          form.submit();
          return;
        }

        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus();
        }
      });
    });

    // کپی کد تخفیف
    document.querySelectorAll('[data-copy-coupon]').forEach((button) => {
      const label = button.textContent;
      button.addEventListener('click', async () => {
        const code = button.parentElement.querySelector('[data-coupon]');
        if (!code) return;
        let copied = false;
        try {
          await navigator.clipboard.writeText(code.textContent.trim());
          copied = true;
        } catch (e) {
          // اگر دسترسی به کلیپ‌بورد نبود، متن کد انتخاب می‌شود تا کاربر خودش کپی کند
          const range = document.createRange();
          range.selectNodeContents(code);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
        button.textContent = copied ? 'کپی شد' : 'کد انتخاب شد';
        setTimeout(() => {
          button.textContent = label;
        }, 2000);
      });
    });
  }

  /* ------------------------------------------------------------------------
     اعتبارسنجی فرم‌ها (فرم تماس) – فقط سمت کاربر
     هر فرم با ویژگی data-validate بررسی می‌شود. قوانین از خود فیلدها خوانده می‌شوند:
       required   → الزامی        type="email" → ایمیل معتبر
       data-min   → حداقل طول    data-phone   → موبایل ایرانی (۰۹xxxxxxxxx)
     برای ارسال واقعی، فرم را به اسکریپت سمت سرور وصل کنید (Help.pdf را ببینید).
     ------------------------------------------------------------------------ */
  const FIELD_LABELS = {};

  function validateField(field) {
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();
    const label = FIELD_LABELS[field.id] || 'این فیلد';

    if (field.required && (field.type === 'checkbox' ? !value : value === '')) {
      return field.type === 'checkbox'
        ? 'برای ارسال پیام، موافقت با شرایط حریم خصوصی لازم است.'
        : field.tagName === 'SELECT'
          ? `لطفاً ${label} را انتخاب کنید.`
          : `لطفاً ${label} را وارد کنید.`;
    }
    if (value === '' || value === false) return '';

    if (field.type === 'email' && !EMAIL_PATTERN.test(value)) {
      return 'ایمیل معتبر نیست؛ مثال درست: name@example.com';
    }
    if (field.hasAttribute('data-phone') && !/^09\d{9}$/.test(toEn(value).replace(/[\s-]/g, ''))) {
      return 'شماره‌ی موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.';
    }
    const min = parseInt(field.dataset.min || '0', 10);
    if (min && value.length < min) {
      return `${label} باید دست‌کم ${toFa(min)} حرف باشد.`;
    }
    return '';
  }

  function initFormValidation() {
    document.querySelectorAll('form[data-validate]').forEach((form) => {
      const fields = Array.from(form.querySelectorAll('input, select, textarea')).filter((f) => f.id);
      const summary = form.querySelector('[data-form-summary]');
      const success = form.parentElement.querySelector('[data-form-success]');

      fields.forEach((field) => {
        const labelEl = form.querySelector(`label[for="${field.id}"]`);
        if (labelEl) FIELD_LABELS[field.id] = labelEl.textContent.replace('*', '').trim();
      });

      const show = (field, message) => {
        const error = document.getElementById(`${field.id}-error`);
        if (message) field.setAttribute('aria-invalid', 'true');
        else field.removeAttribute('aria-invalid');
        if (error) {
          error.textContent = message;
          error.hidden = !message;
        }
      };

      fields.forEach((field) => {
        // بعد از ترک فیلد بررسی می‌شود؛ هنگام تایپ فقط اگر قبلاً خطا داشته
        field.addEventListener('blur', () => {
          if (field.value !== '' || field.getAttribute('aria-invalid') === 'true') show(field, validateField(field));
        });
        field.addEventListener(field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input', () => {
          if (field.getAttribute('aria-invalid') === 'true') show(field, validateField(field));
        });
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const invalid = fields.filter((field) => {
          const message = validateField(field);
          show(field, message);
          return Boolean(message);
        });

        if (invalid.length) {
          if (summary) {
            summary.textContent = `لطفاً ${toFa(invalid.length)} مورد مشخص‌شده را اصلاح کنید.`;
            summary.hidden = false;
          }
          invalid[0].focus();
          return;
        }

        if (summary) summary.hidden = true;

        // اتصال به سرور: اگر action فرم به یک آدرس واقعی (مثلاً contact.php) تنظیم شده باشد،
        // فرم بعد از اعتبارسنجی به همان آدرس ارسال می‌شود. با action="#" فقط پیام موفقیت نمایش داده می‌شود.
        if (hasRealAction(form)) {
          form.submit();
          return;
        }
        form.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus();
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     قیمت‌ها و جداکننده‌ی هزارگان فارسی (٬)
     قیمت‌ها را در HTML با جداکننده‌ی فارسی بنویسید (مثل ۱٬۲۹۵٬۰۰۰).
     چون فونت وزیرمتن این علامت را شبیه کامای انگلیسی رسم می‌کند، اینجا هر ٬ داخل
     قیمت‌ها در یک span.num-sep (داخل span.num) قرار می‌گیرد تا با CSS به شکل درست فارسی دیده شود.
     برای ساختن قیمت با JS از ShabeChelleh.formatPrice(1295000) استفاده کنید.
     ------------------------------------------------------------------------ */
  const formatPrice = (value) => new Intl.NumberFormat('fa-IR').format(value);

  function initNumberSeparators(scope) {
    const SEP = '\u066C';
    const targets = (scope || document).querySelectorAll('.price-now, .product-price del, .feature-price, [data-price]');

    targets.forEach((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        if (walker.currentNode.nodeValue.includes(SEP) && !walker.currentNode.parentNode.classList.contains('num-sep')) {
          nodes.push(walker.currentNode);
        }
      }

      nodes.forEach((node) => {
        // عدد در یک span.num چپ‌به‌راست و ایزوله قرار می‌گیرد تا ترتیب ارقام به‌هم نریزد
        const fragment = document.createElement('span');
        fragment.className = 'num';
        node.nodeValue.split(SEP).forEach((part, i) => {
          if (i > 0) {
            const sep = document.createElement('span');
            sep.className = 'num-sep';
            sep.textContent = SEP;
            fragment.appendChild(sep);
          }
          if (part) fragment.appendChild(document.createTextNode(part));
        });
        node.parentNode.replaceChild(fragment, node);
      });
    });
  }

  /* ------------------------------------------------------------------------
     اجرا
     ------------------------------------------------------------------------ */
  initAnnouncementBar();
  initHeader();
  initMobileMenu();
  initCountdown();
  initParallax();
  initReveal();
  initWishlist();
  initFeature();
  initNumberSeparators();
  initCart();
  initSlider();
  initAccordion();
  initNewsletter();
  initFormValidation();

  // در دسترس قرار دادن ابزارها برای custom.js
  window.ShabeChelleh = { toFa, toEn, formatPrice, initNumberSeparators, cartStore };
})();
