/* 家豐搬家・吊車 — 共用互動
   手機選單、案例篩選、搬家價格試算、情境預選、估價／叫車表單 */
(() => {
  'use strict';

  /* ---------- 手機選單 ---------- */
  const menuBtn = document.querySelector('[data-menu-btn]');
  const nav = document.querySelector('[data-nav]');
  if (menuBtn && nav) {
    const setMenu = (open) => {
      nav.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('nav-open', open);   // 手機滿版選單開啟時鎖住背景捲動
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- 案例篩選 ---------- */
  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const buttons = scope.querySelectorAll('[data-filter]');
    const items = scope.querySelectorAll('[data-cat]');
    const status = scope.querySelector('[data-filter-status]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.filter;
        let shown = 0;
        buttons.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
        items.forEach((item) => {
          const match = key === 'all' || item.dataset.cat.split(' ').includes(key);
          item.hidden = !match;
          if (match) shown += 1;
        });
        if (status) status.textContent = `顯示 ${shown} 則案例`;
      });
    });
  });

  /* ---------- 搬家價格試算 ---------- */
  const est = document.querySelector('[data-estimator]');
  if (est) {
    const BASE = { suite: [4000, 8000], one: [4000, 5500], three: [9500, 11000], house: [15000, 21000] };
    const FLOOR = [[0, 0], [600, 1500], [1500, 3500]];
    const BIG = [1500, 4000];
    const typeEl = est.querySelector('#e-type');
    const floorEl = est.querySelector('#e-floor');
    const craneEl = est.querySelector('#e-crane');
    const bigEl = est.querySelector('#e-big');
    const out = est.querySelector('[data-est-out]');
    const note = est.querySelector('[data-est-note]');
    const fmt = (n) => `NT$ ${n.toLocaleString('en-US')}`;
    if (typeEl && floorEl && craneEl && bigEl && out) {
      const calc = () => {
        const base = BASE[typeEl.value] || BASE.one;
        const floor = FLOOR[Number(floorEl.value)] || FLOOR[0];
        let lo = base[0] + floor[0];
        let hi = base[1] + floor[1];
        if (bigEl.value === '1') { lo += BIG[0]; hi += BIG[1]; }
        out.textContent = `${fmt(lo)} – ${fmt(hi)}`;
        if (note) {
          note.textContent = craneEl.value === '1'
            ? '另加吊車費用，依作業高度與物件報價。'
            : '高雄市區一般行情，最終以估價為準。';
        }
      };
      [typeEl, floorEl, craneEl, bigEl].forEach((el) => el.addEventListener('change', calc));
      calc();
    }
  }

  /* ---------- 情境卡片：預先選好搬家類型 ---------- */
  document.querySelectorAll('[data-preset]').forEach((link) => {
    link.addEventListener('click', () => {
      const name = link.dataset.presetName || 'q-type';
      const radio = Array.from(document.querySelectorAll(`input[name="${name}"]`))
        .find((r) => r.value === link.dataset.preset);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  /* ---------- 估價／叫車表單 ---------- */
  const PHONE_RE = /^0\d{8,9}$/;
  const normalizePhone = (v) => v.replace(/[\s()-]/g, '');

  const initForm = (form) => {
    const wrap = form.closest('[data-form-wrap]');
    const success = wrap ? wrap.querySelector('[data-success]') : null;
    const summary = form.querySelector('[data-error-summary]');
    const summaryList = summary ? summary.querySelector('ul') : null;
    const submit = form.querySelector('[data-submit]');
    const submitLabel = submit ? submit.querySelector('[data-submit-label]') : null;
    const idleText = submitLabel ? submitLabel.textContent : '';
    const rules = Array.from(form.querySelectorAll('[data-rule]'));
    const dirty = new Set();
    let busy = false;

    const valueOf = (el) => {
      if (el.tagName === 'FIELDSET') {
        const picked = el.querySelector('input:checked');
        return picked ? picked.value : '';
      }
      return el.value.trim();
    };

    const messageFor = (el) => {
      const rule = el.dataset.rule || '';
      const v = valueOf(el);
      if (rule.includes('required') && !v) return el.dataset.msg || '這一欄必填。';
      if (rule.includes('phone') && v && !PHONE_RE.test(normalizePhone(v))) {
        return '電話格式不對：請輸入 0 開頭的市話或手機，例如 0953-111-469。';
      }
      return '';
    };

    const render = (el, msg) => {
      const err = document.getElementById(`${el.id}-err`);
      if (err) {
        const text = err.querySelector('[data-err-text]');
        if (text) text.textContent = msg;
        err.hidden = !msg;
      }
      const field = el.closest('.field');
      if (field) field.classList.toggle('has-error', Boolean(msg));
      if (el.tagName !== 'FIELDSET') {
        if (msg) el.setAttribute('aria-invalid', 'true');
        else el.removeAttribute('aria-invalid');
      }
      return msg;
    };

    const focusField = (el) => {
      const target = el.tagName === 'FIELDSET' ? el.querySelector('input') : el;
      if (target) target.focus();
    };

    rules.forEach((el) => {
      if (el.tagName === 'FIELDSET') {
        el.addEventListener('change', () => render(el, messageFor(el)));
        return;
      }
      el.addEventListener('input', () => {
        dirty.add(el);
        if (el.getAttribute('aria-invalid') === 'true') render(el, messageFor(el));
      });
      el.addEventListener('blur', () => {
        if (dirty.has(el) || valueOf(el)) render(el, messageFor(el));
      });
    });

    form.querySelectorAll('input[type="file"]').forEach((input) => {
      const out = document.getElementById(`${input.id}-name`);
      const update = () => {
        if (!out) return;
        const n = input.files ? input.files.length : 0;
        out.textContent = n ? `已選 ${n} 張照片` : '尚未選擇照片';
      };
      input.addEventListener('change', update);
      form.addEventListener('reset', () => window.setTimeout(update, 0));
    });

    const setBusy = (state) => {
      busy = state;
      if (!submit) return;
      submit.setAttribute('aria-busy', state ? 'true' : 'false');
      if (submitLabel) submitLabel.textContent = state ? '送出中…' : idleText;
    };

    const showSuccess = () => {
      if (!success) return;
      success.querySelectorAll('[data-out]').forEach((node) => {
        const src = document.getElementById(node.dataset.out);
        node.textContent = src ? valueOf(src) : '';
      });
      form.hidden = true;
      success.hidden = false;
      success.classList.add('is-in');
      const title = success.querySelector('[data-success-title]');
      (title || success).focus();
    };

    const doSubmit = () => {
      if (busy) return;
      const errors = rules
        .map((el) => ({ el, msg: render(el, messageFor(el)) }))
        .filter((x) => x.msg);

      if (errors.length) {
        if (summary && summaryList) {
          summaryList.replaceChildren(...errors.map(({ el, msg }) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${el.id}`;
            a.textContent = msg;
            a.addEventListener('click', (e) => { e.preventDefault(); focusField(el); });
            li.append(a);
            return li;
          }));
          summary.hidden = false;
          summary.focus();
        } else {
          focusField(errors[0].el);
        }
        return;
      }

      if (summary) summary.hidden = true;
      setBusy(true);
      window.setTimeout(() => {
        setBusy(false);
        showSuccess();
      }, 900);
    };

    if (submit) submit.addEventListener('click', doSubmit);
    form.addEventListener('submit', (e) => { e.preventDefault(); doSubmit(); });
    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
      const t = e.target;
      if (t.matches('input') && !['checkbox', 'radio', 'file', 'button'].includes(t.type)) {
        e.preventDefault();
        doSubmit();
      }
    });

    const again = success ? success.querySelector('[data-reset]') : null;
    if (again) {
      again.addEventListener('click', () => {
        form.reset();
        dirty.clear();
        rules.forEach((el) => render(el, ''));
        if (summary) summary.hidden = true;
        success.hidden = true;
        success.classList.remove('is-in');
        form.hidden = false;
        const first = form.querySelector('input:not([type="hidden"]), select, textarea');
        if (first) first.focus();
      });
    }
  };

  document.querySelectorAll('[data-form]').forEach(initForm);


  // ---------- 證照照片點擊放大 ----------
  const zoomLinks = document.querySelectorAll('[data-zoom]');
  if (zoomLinks.length && typeof HTMLDialogElement === 'function') {
    const dlg = document.createElement('dialog');
    dlg.className = 'zoom-dlg';
    dlg.innerHTML = '<button class="zoom-close" type="button" aria-label="關閉">×</button><img alt="">';
    document.body.appendChild(dlg);
    const big = dlg.querySelector('img');
    let opener = null;
    zoomLinks.forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      opener = a;
      const img = a.querySelector('img');
      big.src = a.getAttribute('href');
      big.alt = img ? img.alt : '';
      dlg.showModal();
    }));
    const close = () => dlg.close();
    dlg.querySelector('.zoom-close').addEventListener('click', close);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });   // 點背景關閉
    dlg.addEventListener('close', () => { big.removeAttribute('src'); if (opener) opener.focus(); });
  }


  // ---------- 點擊追蹤（GA4）：電話、LINE、估價單 ----------
  // <meta name="ga4-id"> 有填才載入 GA4；沒填時事件只留在 dataLayer，不會送出任何資料
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') window.gtag = function () { window.dataLayer.push(arguments); };
  const gaMeta = document.querySelector('meta[name="ga4-id"]');
  const gaId = gaMeta ? gaMeta.content.trim() : '';
  if (gaId) {
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(tag);
    window.gtag('js', new Date());
    window.gtag('config', gaId);
  }
  const AREAS = [['.mbar', 'mobile_bar'], ['.site-head', 'header'], ['.hero2', 'hero'], ['.phero', 'hero'], ['#cta', 'cta_block'],
    ['.qr-card', 'qr_card'], ['.site-foot', 'footer'], ['.contact-card', 'contact_card'], ['.article', 'article'], ['.faq', 'faq']];
  const whereIs = (el) => { for (const [sel, name] of AREAS) if (el.closest(sel)) return name; return 'content'; };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    let name = null;
    const params = { link_location: whereIs(a), page_path: location.pathname };
    if (href.startsWith('tel:')) { name = 'click_phone'; params.phone_number = href.slice(4); }
    else if (href.includes('line.me/')) name = 'click_line';
    else if (href.includes('#quote')) name = 'click_quote_form';
    if (name) window.gtag('event', name, params);
  }, true);
})();
