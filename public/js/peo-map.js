(function () {
  const ADDRESS = "José Enrique Rodó 2270 esquina Juan Paullier, Montevideo, Uruguay";
  const NOMINATIM = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(ADDRESS);

  function log(...a){ console.log("[PEO-MAP]", ...a); }

  async function geocode() {
    const res = await fetch(NOMINATIM, {
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error("Geocode HTTP " + res.status);
    const data = await res.json();
    if (!data || !data[0]) throw new Error("No geocode result");
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }

  async function initMap() {
    const el = document.getElementById("peo-map");
    if (!el || !window.L) { return; }

    try {
      const { lat, lon } = await geocode();
      log("coords", lat, lon);

      const map = L.map("peo-map", { scrollWheelZoom: false }).setView([lat, lon], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      // Pin personalizado (usa tu logo si existe)
      const iconUrl = "/assets/logo_EPT.png";
      const icon = L.icon({
        iconUrl,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([lat, lon], { icon }).addTo(map);
      marker.bindPopup("<b>ElProfeTino</b><br>" + ADDRESS).openPopup();

      // Click para activar zoom con rueda (solo después de tocar el mapa)
      map.on("click", () => { map.scrollWheelZoom.enable(); });

    } catch (e) {
      log("map error:", e);
      el.innerHTML = '<div class="peo-map-fallback">No pude cargar el mapa ahora mismo 😅<br>Dirección: <b>' + ADDRESS + '</b></div>';
    }
  }

  // 2) Agrandar contenedor del video (solo si es seguro)
  function tryEnlargeVideo() {
    // Busca un video grande en la landing
    const v = document.querySelector("video");
    if (!v) return;

    const p = v.closest(".video-container, .hero-video, .video-wrapper, section, div");
    if (!p) return;

    // Si ya es grande, no tocar
    const rect = p.getBoundingClientRect();
    if (rect.width >= 980) return;

    // Ajuste conservador: solo max-width y centrado
    p.style.maxWidth = "1100px";
    p.style.marginLeft = "auto";
    p.style.marginRight = "auto";
    p.style.width = "100%";

    log("video container enlarged (safe mode)");
  }

  function ready(fn){
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(() => {
    initMap();
    tryEnlargeVideo();
  });
})();