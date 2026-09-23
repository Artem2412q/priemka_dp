/* Presentation layer. Does not alter intake state, calculations or Excel cells. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const overlay = document.getElementById('loadingOverlay');
  const progress = overlay.querySelector('[role="progressbar"]');
  const cancel = document.getElementById('loadingCancel');
  let active = false, downloaded = false, lastPercent = 0, dismissTimer = 0, previousFocus = null;
  const roots = [document.querySelector('.app-shell'), document.querySelector('.workflow-dock')];
  function release() {
    clearTimeout(dismissTimer);
    overlay.hidden = true; active = false; downloaded = false;
    roots.forEach(root => { if (root) root.inert = false; });
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  window.FreshnessExport = {
    update(show, status, percent, title) {
      if (!show) {
        if (downloaded) {
          overlay.classList.add('is-done');
          document.getElementById('loadingTitle').textContent = 'Ваш отчёт готов';
          document.getElementById('loadingStatus').textContent = 'Файл передан браузеру для скачивания.';
          document.getElementById('loadingStep').textContent = 'Excel сформирован';
          document.getElementById('loadingPercent').textContent = '100%';
          document.getElementById('loadingProgressBar').style.width = '100%';
          progress.setAttribute('aria-valuenow', '100');
          cancel.hidden = true;
          clearTimeout(dismissTimer); dismissTimer = setTimeout(release, reduce.matches ? 500 : 1500);
        } else release();
        return;
      }
      if (!active) {
        clearTimeout(dismissTimer); active = true; downloaded = false; lastPercent = 0;
        previousFocus = document.activeElement;
        overlay.classList.remove('is-done'); overlay.hidden = false; cancel.hidden = false;
        roots.forEach(root => { if (root) root.inert = true; });
        cancel.focus({ preventScroll: true });
      }
      lastPercent = Math.max(lastPercent, Math.min(99, Number(percent) || 0));
      document.getElementById('loadingTitle').textContent = 'Собираем ваш отчёт';
      document.getElementById('loadingStatus').textContent = status || 'Подготавливаем шаблон…';
      document.getElementById('loadingPercent').textContent = `${lastPercent}%`;
      document.getElementById('loadingStep').textContent = lastPercent < 40 ? 'Подготовка шаблона' : lastPercent < 80 ? 'Перенос данных' : 'Сохранение Excel';
      document.getElementById('loadingProgressBar').style.width = `${lastPercent}%`;
      progress.setAttribute('aria-valuenow', String(lastPercent));
    },
    downloaded() { if (active) downloaded = true; }
  };
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); if (!cancel.hidden) cancel.focus(); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (downloaded) release(); else cancel.click(); }
  });

  const login = document.getElementById('loginOverlay');
  const hero = document.getElementById('heroFilm');
  function syncFilm() { hero?.contentWindow?.postMessage({ type: 'freshness-film', action: login.hidden || document.hidden ? 'pause' : 'resume' }, '*'); }
  new MutationObserver(syncFilm).observe(login, { attributes: true, attributeFilter: ['hidden'] });
  hero.addEventListener('load', syncFilm);
  document.addEventListener('visibilitychange', syncFilm);
  const dialog = document.getElementById('filmDialog');
  const player = document.getElementById('filmDialogPlayer');
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-open-film]')) return;
    document.querySelector('.topbar-more')?.removeAttribute('open');
    if (!player.firstElementChild) {
      const iframe = document.createElement('iframe'); iframe.src = './journey.html';
      iframe.title = 'Ролик «Путь свежести»'; player.append(iframe);
    } else player.firstElementChild.contentWindow?.postMessage({ type: 'freshness-film', action: 'restart' }, '*');
    dialog.showModal(); document.getElementById('filmClose').focus();
  });
  document.getElementById('filmClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => player.firstElementChild?.contentWindow?.postMessage({ type: 'freshness-film', action: 'pause' }, '*'));

  // Associate generated controls with their visible labels without changing data bindings.
  let fieldSerial = 0, pending = false;
  function enhance() {
    pending = false;
    document.querySelectorAll('.field,.measure-card').forEach(field => {
      const label = field.querySelector('label');
      const input = field.querySelector('input:not([type="hidden"]),select,textarea');
      if (!label || !input || label.contains(input)) return;
      if (!input.id) input.id = `fresh-field-${++fieldSerial}`;
      label.htmlFor = input.id;
      if (label.querySelector('.required')) input.setAttribute('aria-required', 'true');
    });
    document.querySelectorAll('.product-management-actions [data-action="move-sku"]').forEach(button => button.setAttribute('aria-label', button.dataset.delta === '-1' ? 'Переместить товар выше' : 'Переместить товар ниже'));
    document.querySelectorAll('.defect-table input,.defect-table select').forEach(input => { if (!input.getAttribute('aria-label')) input.setAttribute('aria-label', input.closest('td')?.dataset.label || 'Значение дефекта'); });
  }
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(enhance); } };
  new MutationObserver(schedule).observe(document.getElementById('pageContent'), { childList: true, subtree: true });
  enhance();
  // Dropdown closes on outside click and Escape.
  document.addEventListener('click', e => {
    const menu = document.querySelector('.topbar-more');
    if (menu?.open && !menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelector('.topbar-more')?.removeAttribute('open'); });
})();
