/**
 * PEO Tools Click - vuelve clickeables las CARDS existentes (sin cambiar HTML/CSS).
 * Busca un contenedor que tenga el título "Herramientas PEO" y dentro detecta cards por texto.
 */
(function () {
  const routes = [
    { key: 'TizaIA', href: '/tizaia' },
    { key: 'GeneraTusEjercicios', href: '/gte' },
    { key: 'TuExamenPersonal', href: '/tep' }
  ];

  function findToolsBlockRoot() {
    // Buscamos el H2/H3 que diga "Herramientas PEO"
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,div,section'))
      .filter(el => (el.textContent || '').trim().includes('Herramientas PEO'));
    if (!headings.length) return null;

    // Tomamos el más cercano "caja" (el que rodea las 3 cards)
    const h = headings[0];
    return h.closest('section,div') || null;
  }

  function pickCardForKey(root, key) {
    // Encontrar el nodo que contiene el nombre
    const nodes = Array.from(root.querySelectorAll('*'))
      .filter(el => el.children.length === 0 && (el.textContent || '').trim() === key);

    if (!nodes.length) return null;

    // Subimos al ancestro más razonable que parece una card (div con padding/borde)
    const n = nodes[0];
    const card = n.closest('a,button,[role="button"],div') || n.parentElement;

    return card;
  }

  function makeClickable(card, href) {
    if (!card) return;

    // Si ya era link, listo
    if (card.tagName === 'A') {
      card.setAttribute('href', href);
      return;
    }

    // Mejor UX
    card.style.cursor = 'pointer';
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');

    // Click + teclado
    card.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = href;
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = href;
      }
    });
  }

  function run() {
    const root = findToolsBlockRoot();
    if (!root) {
      console.warn('[PEO] No encontré el bloque de "Herramientas PEO" en la landing.');
      return;
    }

    routes.forEach(r => {
      const card = pickCardForKey(root, r.key);
      if (!card) {
        console.warn('[PEO] No encontré card para:', r.key);
        return;
      }
      makeClickable(card, r.href);
      console.log('[PEO] Card clickeable:', r.key, '->', r.href);
    });
  }

  // Esperar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();