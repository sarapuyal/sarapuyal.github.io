'use strict';
document.addEventListener('DOMContentLoaded', () => {
  window.i18n.initLanguage();
  initTheme();
  initNavigation();
  initSettings();
  initReveal();
  initVideo();
  document.getElementById('year').textContent = new Date().getFullYear();
});

function initTheme() {
  const apply = (theme) => {
    document.body.dataset.theme = theme === 'dark' ? 'dark' : 'light';
    for (const [id, value] of [['theme-a', 'light'], ['theme-b', 'dark']]) {
      const button = document.getElementById(id);
      button.classList.toggle('active', theme === value);
      button.setAttribute('aria-pressed', String(theme === value));
    }
    try { localStorage.setItem('cv-theme', theme); } catch { /* Storage is optional. */ }
  };
  let theme = 'light';
  try { if (localStorage.getItem('cv-theme') === 'dark') theme = 'dark'; } catch { /* Private browsers may block storage. */ }
  apply(theme);
  document.getElementById('theme-a').addEventListener('click', () => apply('light'));
  document.getElementById('theme-b').addEventListener('click', () => apply('dark'));
}

function initNavigation() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  function close() { menu.classList.remove('active'); toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', String(menu.classList.toggle('active'))));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('active')) { close(); toggle.focus(); }
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
  });
  matchMedia('(min-width: 801px)').addEventListener('change', close);
}

function initSettings() {
  const toggle = document.getElementById('settings-toggle');
  const panel = document.getElementById('settings-panel');
  function close() { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  });
  document.querySelectorAll('.lang-btn').forEach(button => button.addEventListener('click', () => {
    window.i18n.setLanguage(button.dataset.lang);
  }));
  document.addEventListener('click', event => { if (!event.target.closest('.top-controls')) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { close(); toggle.focus(); }
  });
}

function initReveal() {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  document.body.classList.add('motion-ready');
}

async function loadSite() {
  // Static hosts use the same configuration; opening index.html directly retains the placeholder.
  if (!['http:', 'https:'].includes(location.protocol)) return null;
  for (const path of ['api/site', 'site.json']) {
    try {
      const response = await fetch(path, { signal: AbortSignal.timeout(3500), cache: 'no-store' });
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) return await response.json();
    } catch { /* A static host may not provide the API. */ }
  }
  return null;
}

async function initVideo() {
  const config = await loadSite();
  const videoConfig = config?.video || {};
  const source = window.portfolioMedia.normalizeVideo(videoConfig.src);
  if (!source) return;
  const play = document.getElementById('video-play');
  const dialog = document.getElementById('video-dialog');
  const container = document.getElementById('video-player');
  const error = document.getElementById('video-error');
  const poster = window.portfolioMedia.localAsset(videoConfig.poster, 'assets', ['.jpg', '.jpeg', '.png', '.webp']);
  if (poster) document.querySelector('.video-art img').src = poster;
  document.getElementById('video-badge').dataset.i18n = 'video.ready';
  document.getElementById('video-description').dataset.i18n = 'video.description';
  document.getElementById('video-fallback').hidden = true;
  play.hidden = false;
  window.i18n.setLanguage(document.documentElement.lang);
  play.addEventListener('click', () => {
    error.hidden = true;
    container.replaceChildren();
    if (source.type === 'file') {
      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      if (poster) video.poster = poster;
      video.src = source.src;
      const captions = window.portfolioMedia.localAsset(videoConfig.captions, 'media', ['.vtt']);
      if (captions) {
        const track = document.createElement('track');
        track.kind = 'captions'; track.src = captions; track.srclang = 'es'; track.label = 'Español'; track.default = true;
        video.append(track);
      }
      video.addEventListener('error', () => { error.hidden = false; });
      container.append(video);
      dialog.showModal();
      video.play().catch(() => { /* Native controls remain usable if autoplay is blocked. */ });
    } else {
      const frame = document.createElement('iframe');
      frame.src = source.src;
      frame.title = window.i18n.t('video.title');
      frame.allow = 'autoplay; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      container.append(frame);
      dialog.showModal();
    }
  });
  function clearPlayer() {
    const video = container.querySelector('video');
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    container.replaceChildren();
    play.focus();
  }
  document.getElementById('video-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', clearPlayer);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}
