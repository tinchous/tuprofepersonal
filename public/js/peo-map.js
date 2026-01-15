(function () {
  const ADDRESS = "José Enrique Rodó 2270 esquina Juan Paullier, Montevideo, Uruguay";
  const COORDS  = { lat: -34.9049, lon: -56.1747 }; // Montevideo (Cordón) aprox

  function log(...a){ console.log("[PEO-MAP]", ...a); }

  function initMap() {
    const el = document.getElementById("peo-map");
    if (!el) return;
    if (!window.L) { log("Leaflet no cargó"); return; }

    const { lat, lon } = COORDS;
    log("coords", lat, lon);

    const map = L.map("peo-map", { scrollWheelZoom: false }).setView([lat, lon], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    const iconUrl = "/assets/logo_EPT.png";
    const icon = L.icon({
      iconUrl,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -40]
    });

    const marker = L.marker([lat, lon], { icon }).addTo(map);
    marker.bindPopup("<b>ElProfeTino</b><br>" + ADDRESS).openPopup();

    map.on("click", () => { map.scrollWheelZoom.enable(); });
  }

  function ready(fn){
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(initMap);
})();