/* ==========================================================================
   قالب شب‌چله – سوییچر تم (فقط برای دموی قالب)
   --------------------------------------------------------------------------
   این فایل فقط برای پیش‌نمایش تم‌ها در دمو ساخته شده و در سایت واقعی لازم نیست.

   حذف کامل: در هر صفحه‌ی HTML این خط را پاک کنید:
     <script src="assets/js/demo-switcher.js" defer></script>
   سوییچر، استایل‌ها و همه‌ی رفتارهایش با همین یک خط حذف می‌شوند.

   انتخاب تم ثابت برای سایت: کلاس تم را مستقیم روی تگ <html> بگذارید
   (توضیح در assets/css/themes.css و راهنمای قالب).

   امکانات دمو:
   - انتخاب تم از سه دکمه‌ی گوشه‌ی صفحه (در همین مرورگر به خاطر سپرده می‌شود)
   - پیش‌نمایش مستقیم با آدرس، مثل: index.html?theme=nowruz یا ?theme=black-friday
   - تصاویر نمونه‌ی (placeholder) هر تم از پوشه‌ی همان تم نمایش داده می‌شوند
   ========================================================================== */

(function () {
  'use strict';

  const THEMES = [
    { id: '', name: 'یلدا', swatch: ['#0B1220', '#D4A24C', '#9B1B30'], color: '#0B1220' },
    { id: 'black-friday', name: 'بلک‌فرایدی', swatch: ['#0A0A0A', '#FFC400', '#CC4400'], color: '#0A0A0A' },
    { id: 'nowruz', name: 'نوروز', swatch: ['#0C261D', '#F2A7C3', '#1F7A45'], color: '#0C261D' },
  ];
  const STORAGE_KEY = 'shab-demo-theme';
  const root = document.documentElement;

  const readStored = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  };

  const store = (id) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      /* حافظه‌ی مرورگر در دسترس نیست؛ فقط تا رفرش بعدی می‌ماند */
    }
  };

  // تصاویر نمونه‌ی هر تم در پوشه‌ی placeholders/<نام تم>/ قرار دارند
  const swapPlaceholders = (id) => {
    const folder = /placeholders\/(?:black-friday\/|nowruz\/)?/;
    document.querySelectorAll('img[src*="placeholders/"]').forEach((img) => {
      const src = img.getAttribute('src');
      const next = src.replace(folder, `placeholders/${id ? `${id}/` : ''}`);
      if (next !== src) img.setAttribute('src', next);
    });
  };

  const apply = (id) => {
    THEMES.forEach((t) => t.id && root.classList.remove(`theme-${t.id}`));
    if (id) root.classList.add(`theme-${id}`);
    swapPlaceholders(id);

    const theme = THEMES.find((t) => t.id === id) || THEMES[0];
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.color);

    document.querySelectorAll('.demo-switcher__list button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.theme === id));
    });
    if (toggle) toggle.innerHTML = swatch(theme);
  };

  const injectStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .demo-switcher{position:fixed;left:1rem;bottom:1rem;z-index:40;display:flex;align-items:center;gap:.4rem;padding:.35rem;border-radius:999px;background:rgb(var(--c-night-deep)/.82);border:1px solid rgb(var(--c-gold)/.3);box-shadow:0 18px 40px -18px rgb(0 0 0/.8);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-size:.75rem;color:rgb(var(--c-cream)/.85)}
      .demo-switcher__list{display:flex;align-items:center;gap:.4rem;padding-inline:.4rem .1rem}
      .demo-switcher__label{padding-inline:.15rem .35rem}
      .demo-switcher button{display:grid;place-items:center;width:2rem;height:2rem;border-radius:999px;border:1px solid transparent;cursor:pointer;transition:border-color .3s,transform .3s}
      .demo-switcher button:hover{transform:translateY(-2px)}
      .demo-switcher [aria-pressed="true"]{border-color:rgb(var(--c-gold))}
      .demo-switcher button span[aria-hidden]{width:1.35rem;height:1.35rem;border-radius:999px;box-shadow:inset 0 0 0 1px rgb(255 255 255/.18)}
      .demo-switcher__toggle{width:2.4rem!important;height:2.4rem!important}
      .demo-switcher__toggle span[aria-hidden]{width:1.6rem!important;height:1.6rem!important}
      @media (max-width:1279px){.demo-switcher:not(.is-open) .demo-switcher__list{display:none}}
      @media (min-width:1280px){.demo-switcher{flex-direction:column;left:.75rem;bottom:auto;top:50%;transform:translateY(-50%);padding:.6rem .35rem;border-radius:1.5rem}.demo-switcher__list{flex-direction:column;padding:0}.demo-switcher__label{writing-mode:vertical-rl;padding:.2rem 0 .35rem}.demo-switcher__toggle{display:none!important}}
      body.is-locked .demo-switcher{display:none}
      @media print{.demo-switcher{display:none}}
    `;
    document.head.appendChild(style);
  };

  const swatch = (theme) => {
    const [a, b, c] = theme.swatch;
    return `<span aria-hidden="true" style="background:conic-gradient(${b} 0 33%, ${c} 0 50%, ${a} 0)"></span>`;
  };

  let box = null;
  let toggle = null;

  const setOpen = (open) => {
    box.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  const build = () => {
    box = document.createElement('div');
    box.className = 'demo-switcher';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'انتخاب تم رنگی (فقط در دمو)');

    // در صفحه‌های کوچک‌تر از 1280px فقط این دکمه‌ی گرد دیده می‌شود و با کلیک باز می‌شود
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'demo-switcher__toggle';
    toggle.setAttribute('aria-label', 'نمایش تم‌های دمو');
    toggle.setAttribute('aria-controls', 'demo-switcher-list');
    toggle.addEventListener('click', () => setOpen(!box.classList.contains('is-open')));

    const list = document.createElement('div');
    list.className = 'demo-switcher__list';
    list.id = 'demo-switcher-list';
    list.innerHTML = '<span class="demo-switcher__label">تم دمو</span>';

    THEMES.forEach((theme) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.theme = theme.id;
      button.title = `تم ${theme.name}`;
      button.setAttribute('aria-label', `تم ${theme.name}`);
      button.innerHTML = swatch(theme);
      button.addEventListener('click', () => {
        store(theme.id);
        apply(theme.id);
      });
      list.appendChild(button);
    });

    box.append(toggle, list);
    document.body.appendChild(box);
    setOpen(false);

    // بستن با Esc یا کلیک بیرون از سوییچر
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && box.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!box.contains(event.target)) setOpen(false);
    });
  };

  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  const valid = (id) => THEMES.some((t) => t.id === id);
  const current = (THEMES.find((t) => t.id && root.classList.contains(`theme-${t.id}`)) || THEMES[0]).id;
  const stored = readStored();
  // اولویت: تم آدرس (?theme=) ← تم انتخاب‌شده‌ی قبلی ← کلاس فعلی روی <html>
  const initial = fromUrl !== null && valid(fromUrl) ? fromUrl : stored && valid(stored) ? stored : current;

  injectStyles();
  build();
  apply(initial);

  // تصاویر کوچک سبد خرید هم با تم دمو هماهنگ شوند
  document.addEventListener('shab:cart-render', () => {
    const active = (THEMES.find((t) => t.id && root.classList.contains(`theme-${t.id}`)) || THEMES[0]).id;
    swapPlaceholders(active);
  });
})();
