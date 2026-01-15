// ========================================
// MAPA ELPROFETINO - UBICACIÓN EXACTA
// José Enrique Rodó 2270, Montevideo
// ========================================

// Coordenadas EXACTAS de ElProfeTino
const UBICACION_ELPROFETINO = {
    lat: -34.9041,
    lng: -56.1767,
    direccion: "José Enrique Rodó 2270, Cordón, Montevideo, Uruguay",
    ciudad: "Montevideo",
    barrio: "Cordón",
    codigoPostal: "11214",
    pais: "Uruguay"
};

// Inicializar mapa cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎓 Iniciando mapa de ElProfeTino...');
    console.log('📍 Ubicación:', UBICACION_ELPROFETINO.direccion);
    
    // Crear contenedor del mapa si no existe
    if (!document.getElementById('map')) {
        crearContenedorMapa();
    }
    
    inicializarMapa();
});

function crearContenedorMapa() {
    // Buscar footer o crear contenedor
    const footer = document.querySelector('footer') || document.body;
    
    const mapContainer = document.createElement('div');
    mapContainer.id = 'map-container';
    mapContainer.className = 'map-container-uruguay';
    mapContainer.innerHTML = \
        <h2 class="map-title">
            <span style="color: #4a90e2;">📍</span> 
            <span style="color: #2c3e50;">Ubicación de ElProfeTino</span>
        </h2>
        <p class="map-subtitle">
            José Enrique Rodó 2270, Cordón • Montevideo, Uruguay • CP: 11214
        </p>
        <div id="map" style="height: 500px; width: 100%; border-radius: 15px;"></div>
        <div class="map-info">
            <div class="info-card">
                <span class="info-icon">🎓</span>
                <div>
                    <strong>Clases Presenciales</strong>
                    <p>En esta ubicación exacta</p>
                </div>
            </div>
            <div class="info-card">
                <span class="info-icon">⏰</span>
                <div>
                    <strong>Horario Flexible</strong>
                    <p>Coordinación previa</p>
                </div>
            </div>
            <div class="info-card">
                <span class="info-icon">📞</span>
                <div>
                    <strong>Contacto</strong>
                    <p>WhatsApp/Email</p>
                </div>
            </div>
        </div>
    \;
    
    footer.appendChild(mapContainer);
    injectMapStyles();
}

function inicializarMapa() {
    // Esperar a que Leaflet esté disponible
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet no está cargado');
        return;
    }
    
    // Crear mapa centrado en Montevideo
    const map = L.map('map').setView([UBICACION_ELPROFETINO.lat, UBICACION_ELPROFETINO.lng], 17);
    
    // Capa de OpenStreetMap en español
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | ElProfeTino Uruguay',
        maxZoom: 19
    }).addTo(map);
    
    // ===== ICONO PERSONALIZADO URUGUAY =====
    const iconoUruguay = L.divIcon({
        html: \
        <div class="pin-uruguay">
            <div class="pin-circle">
                <div class="pin-content">
                    <span class="pin-icon">🎓</span>
                    <span class="pin-text">TINO</span>
                </div>
            </div>
            <div class="pin-shadow"></div>
        </div>
        \,
        iconSize: [60, 60],
        iconAnchor: [30, 60],
        popupAnchor: [0, -55],
        className: 'pin-elprofetino'
    });
    
    // ===== MARCADOR PRINCIPAL CON UBICACIÓN EXACTA =====
    const marker = L.marker([UBICACION_ELPROFETINO.lat, UBICACION_ELPROFETINO.lng], {
        icon: iconoUruguay,
        title: 'ElProfeTino - José Enrique Rodó 2270',
        alt: 'Ubicación exacta de ElProfeTino en Montevideo'
    }).addTo(map);
    
    // Popup con información detallada
    marker.bindPopup(\
        <div class="popup-uruguay">
            <div class="popup-header">
                <h3>🎓 ElProfeTino</h3>
                <span class="popup-badge">📍 Ubicación Exacta</span>
            </div>
            
            <div class="popup-content">
                <div class="popup-row">
                    <span class="popup-label">🏠 Dirección:</span>
                    <span class="popup-value"></span>
                </div>
                
                <div class="popup-row">
                    <span class="popup-label">🏙️ Barrio:</span>
                    <span class="popup-value"></span>
                </div>
                
                <div class="popup-row">
                    <span class="popup-label">📮 CP:</span>
                    <span class="popup-value"></span>
                </div>
                
                <div class="popup-row">
                    <span class="popup-label">🇺🇾 Ciudad:</span>
                    <span class="popup-value">, </span>
                </div>
                
                <div class="popup-row">
                    <span class="popup-label">📅 Disponibilidad:</span>
                    <span class="popup-value">Clases presenciales y online</span>
                </div>
            </div>
            
            <div class="popup-footer">
                <a href="https://maps.google.com/?q=," 
                   target="_blank" class="popup-button">
                   📍 Abrir en Google Maps
                </a>
            </div>
        </div>
    \, {
        maxWidth: 300,
        minWidth: 280
    }).openPopup();
    
    // ===== AÑADIR PUNTOS DE REFERENCIA CERCANOS =====
    const puntosReferencia = [
        {
            lat: -34.9035,
            lng: -56.1775,
            nombre: "Plaza de los Treinta y Tres",
            icono: "🌳",
            tipo: "plaza"
        },
        {
            lat: -34.9052,
            lng: -56.1758,
            nombre: "Facultad de Ingeniería",
            icono: "🏛️",
            tipo: "universidad"
        },
        {
            lat: -34.9028,
            lng: -56.1783,
            nombre: "Hospital de Clínicas",
            icono: "🏥",
            tipo: "hospital"
        },
        {
            lat: -34.9061,
            lng: -56.1790,
            nombre: "Parque Rodó (cercano)",
            icono: "🌲",
            tipo: "parque"
        }
    ];
    
    puntosReferencia.forEach(punto => {
        const distancia = calcularDistancia(
            UBICACION_ELPROFETINO.lat,
            UBICACION_ELPROFETINO.lng,
            punto.lat,
            punto.lng
        );
        
        L.marker([punto.lat, punto.lng], {
            icon: L.divIcon({
                html: \<div class="punto-referencia">\</div>\,
                iconSize: [30, 30],
                className: 'punto-' + punto.tipo
            })
        }).addTo(map)
        .bindPopup(\
            <strong>\ \</strong><br>
            📏 Aprox. \ km de ElProfeTino<br>
            🚶‍♂️ \ metros
        \);
    });
    
    // ===== GEOLOCALIZACIÓN DEL VISITANTE =====
    if (navigator.geolocation) {
        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        navigator.geolocation.getCurrentPosition(
            function(posicion) {
                const userLat = posicion.coords.latitude;
                const userLng = posicion.coords.longitude;
                const distancia = calcularDistancia(
                    userLat, userLng,
                    UBICACION_ELPROFETINO.lat, UBICACION_ELPROFETINO.lng
                );
                
                // Marcador del usuario
                L.marker([userLat, userLng], {
                    icon: L.divIcon({
                        html: '<div class="user-location">📍<div class="user-pulse"></div></div>',
                        iconSize: [40, 40],
                        className: 'user-marker'
                    })
                }).addTo(map)
                .bindPopup(\
                    <strong>¡Tú estás aquí!</strong><br>
                    📏 Distancia a ElProfeTino: <b>\ km</b><br>
                    🚗 Tiempo aprox: \ min en auto
                \);
                
                // Línea de conexión
                L.polyline([
                    [userLat, userLng],
                    [UBICACION_ELPROFETINO.lat, UBICACION_ELPROFETINO.lng]
                ], {
                    color: '#4a90e2',
                    weight: 3,
                    dashArray: '10, 5',
                    opacity: 0.6
                }).addTo(map);
                
                // Ajustar vista
                const bounds = L.latLngBounds(
                    [userLat, userLng],
                    [UBICACION_ELPROFETINO.lat, UBICACION_ELPROFETINO.lng]
                );
                map.fitBounds(bounds, { padding: [100, 100] });
            },
            function(error) {
                console.log("📍 Geolocalización no disponible");
                map.setView([UBICACION_ELPROFETINO.lat, UBICACION_ELPROFETINO.lng], 16);
            },
            geoOptions
        );
    }
    
    // ===== CONTROLES DEL MAPA =====
    // Escala en kilómetros
    L.control.scale({
        imperial: false,
        metric: true,
        position: 'bottomleft'
    }).addTo(map);
    
    // Botón de ubicación
    L.control.locate({
        position: 'bottomright',
        strings: {
            title: "¿Dónde estoy?",
            popup: "Estás a {distance} km de ElProfeTino"
        },
        locateOptions: {
            maxZoom: 16
        }
    }).addTo(map);
    
    console.log('✅ Mapa de Montevideo configurado correctamente');
}

// ===== FUNCIONES UTILITARIAS =====
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function injectMapStyles() {
    const styleId = 'estilos-mapa-uruguay';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = \
        /* Estilos para el mapa de Uruguay */
        .map-container-uruguay {
            background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
            padding: 25px;
            border-radius: 20px;
            margin: 30px auto;
            max-width: 1200px;
            box-shadow: 0 10px 30px rgba(0, 91, 187, 0.1);
            border: 1px solid #c1d9ff;
        }
        
        .map-title {
            color: #1a237e;
            text-align: center;
            font-size: 2.2rem;
            margin-bottom: 10px;
            font-weight: 800;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.1);
        }
        
        .map-subtitle {
            color: #5d6bb0;
            text-align: center;
            font-size: 1.2rem;
            margin-bottom: 25px;
            font-style: italic;
        }
        
        #map {
            border: 3px solid #1a237e !important;
            box-shadow: 0 8px 25px rgba(26, 35, 126, 0.2) !important;
        }
        
        /* Pin de Uruguay */
        .pin-uruguay {
            position: relative;
            animation: floatUruguay 3s ease-in-out infinite;
        }
        
        .pin-circle {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #0038a8 0%, #7bafd9 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 5px 15px rgba(0, 56, 168, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
        }
        
        .pin-content {
            transform: rotate(45deg);
            color: white;
            text-align: center;
            line-height: 1;
        }
        
        .pin-icon {
            font-size: 20px;
            display: block;
        }
        
        .pin-text {
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 1px;
            margin-top: 2px;
            display: block;
        }
        
        @keyframes floatUruguay {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        /* Popup estilizado */
        .popup-uruguay {
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        
        .popup-header {
            background: linear-gradient(90deg, #0038a8, #7bafd9);
            color: white;
            padding: 12px 15px;
            border-radius: 8px 8px 0 0;
            margin: -16px -16px 15px -16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .popup-badge {
            background: white;
            color: #0038a8;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
        }
        
        .popup-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }
        
        .popup-label {
            color: #555;
            font-weight: 600;
            min-width: 110px;
        }
        
        .popup-value {
            color: #222;
            text-align: right;
            flex: 1;
        }
        
        .popup-button {
            display: block;
            background: #0038a8;
            color: white;
            text-align: center;
            padding: 10px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 10px;
            transition: all 0.3s;
        }
        
        .popup-button:hover {
            background: #00257a;
            transform: translateY(-2px);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .map-container-uruguay {
                padding: 15px;
                margin: 20px 10px;
            }
            
            .map-title {
                font-size: 1.6rem;
            }
            
            .map-subtitle {
                font-size: 1rem;
            }
            
            #map {
                height: 400px !important;
            }
        }
        
        @media (max-width: 480px) {
            #map {
                height: 350px !important;
            }
            
            .popup-row {
                flex-direction: column;
            }
            
            .popup-value {
                text-align: left;
                margin-top: 3px;
            }
        }
    \;
    document.head.appendChild(style);
}

// Cargar Leaflet si no está disponible
if (typeof L === 'undefined') {
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    leafletCSS.crossOrigin = '';
    
    const leafletJS = document.createElement('script');
    leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletJS.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    leafletJS.crossOrigin = '';
    
    document.head.appendChild(leafletCSS);
    document.head.appendChild(leafletJS);
    
    // Esperar a que Leaflet cargue
    leafletJS.onload = function() {
        console.log('✅ Leaflet cargado dinámicamente');
        inicializarMapa();
    };
}
