/* Used by the browser and server so video configuration follows one contract. */
(function (root) {
  'use strict';
  function localAsset(value, folder, extensions) {
    if (typeof value !== 'string' || /[\\?#\x00-\x1f]/.test(value)) return '';
    let decoded;
    try { decoded = decodeURIComponent(value).replace(/^\//, ''); } catch { return ''; }
    if (/[\\?#\x00-\x1f]/.test(decoded) || !decoded.startsWith(folder + '/') || decoded.split('/').some(part => !part || part === '.' || part === '..')) return '';
    if (!extensions.some(ext => decoded.toLowerCase().endsWith(ext))) return '';
    return decoded.split('/').map(encodeURIComponent).join('/');
  }
  function normalizeVideo(source) {
    if (!source || typeof source !== 'string') return null;
    const local = localAsset(source.trim(), 'media', ['.mp4', '.webm']);
    if (local) return { type: 'file', src: local };
    let url;
    try { url = new URL(source.trim()); } catch { return null; }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1) : url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:embed|shorts)\/([^/]+)\/?$/.exec(url.pathname)?.[1];
      if (!/^[\w-]{11}$/.test(id || '')) return null;
      return { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` };
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
      const match = /^\/(?:video\/)?(\d+)(?:\/([a-f0-9]+))?\/?$/.exec(url.pathname);
      if (!match) return null;
      const hash = match[2] || url.searchParams.get('h');
      if (hash && !/^[a-f0-9]+$/i.test(hash)) return null;
      return { type: 'vimeo', src: `https://player.vimeo.com/video/${match[1]}?autoplay=1${hash ? '&h=' + hash : ''}` };
    }
    if (/\.(mp4|webm)$/i.test(url.pathname)) return { type: 'file', src: url.href };
    return null;
  }
  const api = { normalizeVideo, localAsset };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.portfolioMedia = api;
})(typeof window === 'undefined' ? globalThis : window);
