(() => {
  'use strict';
  const film = document.getElementById('film');
  const toggle = document.getElementById('playToggle');
  const glyph = document.getElementById('playGlyph');
  const buttons = [...document.querySelectorAll('[data-goto]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = [
    ['01 / БЕРЕЖНО ВЫРАЩЕНО', '01 / ПРОИСХОЖДЕНИЕ', 'Всё начинается с урожая.'],
    ['02 / ТОЧКА ПРИБЫТИЯ', '02 / РАСПРЕДЕЛИТЕЛЬНЫЙ ЦЕНТР', 'Свежая поставка. Внимание к деталям.'],
    ['03 / РЕШАЮЩИЙ ЭТАП', '03 / КОНТРОЛЬ КАЧЕСТВА', 'На полку — только после проверки.'],
    ['04 / СВЕЖЕСТЬ РЯДОМ', '04 / КОНТРОЛЬ УСПЕШНО ПРОЙДЕН', 'Теперь — на полки «Магнита».']
  ];
  const duration = 6000;
  let elapsed = 0, last = 0, frame = 0, scene = -1, playing = !reduced.matches, suspended = false;
  const total = duration * scenes.length;
  function draw() {
    const next = Math.min(3, Math.floor(elapsed / duration));
    if (next !== scene) {
      scene = next; film.dataset.scene = String(scene);
      document.getElementById('chapter').textContent = scenes[scene][0];
      document.getElementById('sceneKicker').textContent = scenes[scene][1];
      document.getElementById('sceneTitle').textContent = scenes[scene][2];
    }
    film.classList.toggle('approved', elapsed >= duration * 2 + 3900 || (reduced.matches && scene === 2));
    buttons.forEach((b, i) => {
      b.classList.toggle('active', i === scene);
      b.setAttribute('aria-current', i === scene ? 'step' : 'false');
      b.style.setProperty('--progress', `${Math.max(0, Math.min(100, (elapsed - duration * i) / duration * 100))}%`);
    });
  }
  function sync() {
    film.classList.toggle('paused', !playing || suspended);
    const replay = elapsed >= total;
    toggle.setAttribute('aria-label', replay ? 'Повторить ролик' : playing ? 'Поставить ролик на паузу' : 'Воспроизвести ролик');
    toggle.title = replay ? 'Повторить' : playing ? 'Пауза' : 'Воспроизвести';
    glyph.innerHTML = replay ? '<path d="M4 7a7 7 0 1 1 0 7M4 3v4h4"/>' : playing ? '<path d="M7 5v10M13 5v10"/>' : '<path d="m7 4 9 6-9 6V4Z"/>';
    cancelAnimationFrame(frame); last = 0;
    if (playing && !suspended) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    if (last) elapsed = Math.min(total, elapsed + Math.min(now - last, 100));
    last = now; draw();
    if (elapsed >= total) { playing = false; sync(); return; }
    frame = requestAnimationFrame(tick);
  }
  toggle.addEventListener('click', () => { if (elapsed >= total) elapsed = 0; playing = !playing; draw(); sync(); });
  buttons.forEach((b, i) => b.addEventListener('click', () => { elapsed = i * duration; draw(); sync(); }));
  document.addEventListener('visibilitychange', () => { suspended = document.hidden; sync(); });
  window.addEventListener('message', event => {
    if (event.source !== parent || !event.data || event.data.type !== 'freshness-film') return;
    suspended = event.data.action === 'pause';
    if (event.data.action === 'restart') { elapsed = 0; playing = !reduced.matches; draw(); }
    sync();
  });
  reduced.addEventListener('change', () => { if (reduced.matches) playing = false; sync(); });
  draw(); sync();
})();
