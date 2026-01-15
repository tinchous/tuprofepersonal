/* PEO Tools Navigation (external) */
(function () {
  function inRect(x, y, r) {
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  function go(href) {
    if (!href) return;
    window.location.href = href;
  }

  // Debug: confirma que se cargó
  console.log("[PEO] peo-tools-nav.js loaded");

  document.addEventListener('click', function (ev) {
    try {
      const section = document.getElementById('peo-tools');
      if (!section) return;

      const sx = ev.clientX, sy = ev.clientY;
      const srect = section.getBoundingClientRect();
      if (!inRect(sx, sy, srect)) return;

      const cards = Array.from(section.querySelectorAll('.peo-tool-card[data-href]'));
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        if (inRect(sx, sy, r)) {
          ev.preventDefault();
          ev.stopPropagation();
          go(card.getAttribute('data-href'));
          return;
        }
      }
    } catch (e) {
      console.warn("[PEO] click handler error", e);
    }
  }, true);

  document.addEventListener('keydown', function (ev) {
    const active = document.activeElement;
    if (!active || !active.classList || !active.classList.contains('peo-tool-card')) return;
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      go(active.getAttribute('data-href'));
    }
  });
})();