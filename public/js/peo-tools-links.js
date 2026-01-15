(function () {
  const routes = ['/tizaia', '/gte', '/tep'];

  function makeClickable(el, href) {
    if (!el) return;
    el.style.cursor = 'pointer';
    el.setAttribute('role', 'link');
    el.setAttribute('tabindex', '0');

    // click
    el.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = href;
    }, true);

    // teclado
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = href;
      }
    });
  }

  function findSectionByHeadingText(text) {
    const candidates = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
    const h = candidates.find(x => (x.textContent || '').toLowerCase().includes(text.toLowerCase()));
    if (!h) return null;
    return h.closest('section,div') || null;
  }

  function findThreeCards(root) {
    if (!root) return [];

    // 1) si hay un grid/row con 3 hijos, lo tomamos
    const likelyContainers = Array.from(root.querySelectorAll('div'))
      .filter(d => d.children && d.children.length >= 3);

    // Elegimos el contenedor cuyo texto incluye los 3 nombres (sin confiar en emojis)
    const wanted = ['tiza', 'ejerc', 'examen'];
    let best = null;
    for (const c of likelyContainers) {
      const t = (c.textContent || '').toLowerCase();
      const score = wanted.reduce((s, w) => s + (t.includes(w) ? 1 : 0), 0);
      if (score >= 2) { best = c; break; }
    }
    if (!best) best = likelyContainers[0] || root;

    // 2) cards = hijos directos del contenedor (los que ves como “cajitas”)
    let kids = Array.from(best.children || []);
    // Filtrar elementos vacíos o raros
    kids = kids.filter(k => (k.textContent || '').trim().length > 0);

    // Si hay más de 3, nos quedamos con las primeras 3 “más grandes”
    if (kids.length > 3) {
      kids = kids
        .map(k => ({ k, area: (k.getBoundingClientRect().width * k.getBoundingClientRect().height) || 0 }))
        .sort((a,b) => b.area - a.area)
        .slice(0,3)
        .map(x => x.k);
      // reordenar según posición horizontal en pantalla
      kids = kids.sort((a,b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    }

    // Si hay menos de 3, último intento: buscar “cards” por borde/padding (heurística simple)
    if (kids.length < 3) {
      const all = Array.from(root.querySelectorAll('div'));
      const cards = all.filter(d => {
        const r = d.getBoundingClientRect();
        if (r.width < 180 || r.height < 60) return false;
        const t = (d.textContent || '').toLowerCase();
        return t.includes('tiza') || t.includes('ejerc') || t.includes('examen');
      });
      const uniq = [];
      for (const c of cards) {
        if (!uniq.some(u => u.contains(c) || c.contains(u))) uniq.push(c);
      }
      kids = uniq.slice(0,3);
    }

    return kids.slice(0,3);
  }

  function run() {
    const root = findSectionByHeadingText('Herramientas PEO');
    if (!root) {
      console.warn('[PEO] No encontré sección Herramientas PEO');
      return;
    }

    const cards = findThreeCards(root);
    if (cards.length !== 3) {
      console.warn('[PEO] No pude identificar 3 cards. Encontré:', cards.length);
      return;
    }

    for (let i=0; i<3; i++) makeClickable(cards[i], routes[i]);
    console.log('[PEO] Cards clickeables OK:', routes);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();